-- Nets each month's recurring bills (internet/electricity/other) against partner payouts, the
-- same way reservation_shares nets each reservation's net_amount. Split by ownership %, with its
-- own pending/paid tracking so a bill's cost can be settled independently of reservation payouts.
create table monthly_expense_shares (
  id uuid primary key default gen_random_uuid(),
  monthly_expense_id uuid not null references monthly_expenses(id) on delete cascade,
  partner_id uuid not null references partners(id),
  ownership_percent_snapshot numeric(9, 6) not null,
  share_amount numeric(12, 2) not null,
  payout_status payout_status not null default 'pending',
  paid_at timestamptz,
  paid_note text,
  created_at timestamptz not null default now(),
  unique (monthly_expense_id, partner_id)
);

create index idx_monthly_expense_shares_partner on monthly_expense_shares(partner_id);
create index idx_monthly_expense_shares_expense on monthly_expense_shares(monthly_expense_id);

alter table monthly_expense_shares enable row level security;

-- Same visibility shape as reservation_shares: the per-partner breakdown stays hidden from the
-- manager role. Writes go through upsert_monthly_expense_with_shares() below; admin keeps direct
-- access (via monthly_expense_shares_write_admin) for status corrections.
create policy monthly_expense_shares_select_admin_partner on monthly_expense_shares for select
  using (auth_role() in ('admin', 'partner'));
create policy monthly_expense_shares_write_admin on monthly_expense_shares for all
  using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- Upserts a month's bill (keyed by its unique `month`) and re-snapshots partner shares using
-- CURRENT ownership percentages. Same rule as update_reservation_with_shares: if a partner's
-- recomputed share differs from what was already stored, that partner's payout is forced back to
-- 'pending' rather than silently keeping a stale 'paid' flag on a changed amount.
create function upsert_monthly_expense_with_shares(
  p_month date,
  p_internet_bill numeric,
  p_electricity_bill numeric,
  p_other_expense numeric,
  p_other_expense_note text,
  p_shares jsonb -- [{"partner_id": "...", "ownership_percent_snapshot": 42.928111, "share_amount": 123.45}, ...]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_expense_id uuid;
  share jsonb;
  v_partner_id uuid;
  v_ownership_percent numeric;
  v_share_amount numeric;
  v_existing_amount numeric;
  v_changed boolean;
begin
  if auth_role() != 'admin' then
    raise exception 'not authorized to manage monthly bills';
  end if;

  insert into monthly_expenses (month, internet_bill, electricity_bill, other_expense, other_expense_note)
  values (p_month, p_internet_bill, p_electricity_bill, p_other_expense, p_other_expense_note)
  on conflict (month) do update set
    internet_bill = excluded.internet_bill,
    electricity_bill = excluded.electricity_bill,
    other_expense = excluded.other_expense,
    other_expense_note = excluded.other_expense_note,
    updated_at = now()
  returning id into v_expense_id;

  for share in select * from jsonb_array_elements(p_shares)
  loop
    v_partner_id := (share ->> 'partner_id')::uuid;
    v_ownership_percent := (share ->> 'ownership_percent_snapshot')::numeric;
    v_share_amount := (share ->> 'share_amount')::numeric;

    select share_amount into v_existing_amount
    from monthly_expense_shares
    where monthly_expense_id = v_expense_id and partner_id = v_partner_id;

    v_changed := v_existing_amount is distinct from v_share_amount;

    insert into monthly_expense_shares (monthly_expense_id, partner_id, ownership_percent_snapshot, share_amount)
    values (v_expense_id, v_partner_id, v_ownership_percent, v_share_amount)
    on conflict (monthly_expense_id, partner_id) do update set
      ownership_percent_snapshot = excluded.ownership_percent_snapshot,
      share_amount = excluded.share_amount,
      payout_status = case when v_changed then 'pending' else monthly_expense_shares.payout_status end,
      paid_at = case when v_changed then null else monthly_expense_shares.paid_at end;
  end loop;

  return v_expense_id;
end;
$$;
