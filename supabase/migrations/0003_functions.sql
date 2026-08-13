-- Helper functions for RLS (avoid recursive policy lookups) and atomic reservation writes.

create function auth_role() returns user_role
language sql security definer stable set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create function auth_partner_id() returns uuid
language sql security definer stable set search_path = public as $$
  select partner_id from profiles where id = auth.uid()
$$;

-- Inserts a reservation and its partner share rows atomically. Money math (fee/net/share amounts)
-- is computed in lib/finance.ts and passed in already-final — this function only persists it.
create function create_reservation_with_shares(
  p_guest_name text,
  p_platform text,
  p_rental_type text,
  p_check_in date,
  p_check_out date,
  p_gross_amount numeric,
  p_paid_amount numeric,
  p_payment_method text,
  p_fee_method fee_method,
  p_fee_percent numeric,
  p_fee_amount numeric,
  p_expense_amount numeric,
  p_expense_note text,
  p_net_amount numeric,
  p_status reservation_status,
  p_notes text,
  p_created_by uuid,
  p_shares jsonb -- [{"partner_id": "...", "ownership_percent_snapshot": 42.928111, "share_amount": 123.45}, ...]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_reservation_id uuid;
begin
  -- This function is security definer so it can write reservation_shares even though
  -- the manager role has no direct table grant on it (manager can't SELECT partner shares).
  -- Guard here since security definer bypasses RLS entirely.
  if auth_role() not in ('admin', 'manager') then
    raise exception 'not authorized to create reservations';
  end if;

  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    p_guest_name, p_platform, p_rental_type, p_check_in, p_check_out, p_gross_amount, p_paid_amount,
    p_payment_method, p_fee_method, p_fee_percent, p_fee_amount, p_expense_amount, p_expense_note,
    p_net_amount, p_status, p_notes, p_created_by
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount)
  select
    v_reservation_id,
    (share ->> 'partner_id')::uuid,
    (share ->> 'ownership_percent_snapshot')::numeric,
    (share ->> 'share_amount')::numeric
  from jsonb_array_elements(p_shares) as share;

  return v_reservation_id;
end;
$$;

-- Updates a reservation and re-snapshots its shares using CURRENT ownership percentages.
-- If a partner's recomputed share_amount differs from what was stored, that partner's payout
-- is forced back to 'pending' (never silently keep a stale "paid" flag on a changed amount).
create function update_reservation_with_shares(
  p_reservation_id uuid,
  p_guest_name text,
  p_platform text,
  p_rental_type text,
  p_check_in date,
  p_check_out date,
  p_gross_amount numeric,
  p_paid_amount numeric,
  p_payment_method text,
  p_fee_method fee_method,
  p_fee_percent numeric,
  p_fee_amount numeric,
  p_expense_amount numeric,
  p_expense_note text,
  p_net_amount numeric,
  p_status reservation_status,
  p_notes text,
  p_shares jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare
  share jsonb;
  v_partner_id uuid;
  v_ownership_percent numeric;
  v_share_amount numeric;
  v_existing_amount numeric;
begin
  if auth_role() not in ('admin', 'manager') then
    raise exception 'not authorized to edit reservations';
  end if;

  update reservations set
    guest_name = p_guest_name,
    platform = p_platform,
    rental_type = p_rental_type,
    check_in = p_check_in,
    check_out = p_check_out,
    gross_amount = p_gross_amount,
    paid_amount = p_paid_amount,
    payment_method = p_payment_method,
    fee_method = p_fee_method,
    fee_percent = p_fee_percent,
    fee_amount = p_fee_amount,
    expense_amount = p_expense_amount,
    expense_note = p_expense_note,
    net_amount = p_net_amount,
    status = p_status,
    notes = p_notes,
    updated_at = now()
  where id = p_reservation_id;

  for share in select * from jsonb_array_elements(p_shares)
  loop
    v_partner_id := (share ->> 'partner_id')::uuid;
    v_ownership_percent := (share ->> 'ownership_percent_snapshot')::numeric;
    v_share_amount := (share ->> 'share_amount')::numeric;

    select share_amount into v_existing_amount
    from reservation_shares
    where reservation_id = p_reservation_id and partner_id = v_partner_id;

    if v_existing_amount is distinct from v_share_amount then
      update reservation_shares set
        ownership_percent_snapshot = v_ownership_percent,
        share_amount = v_share_amount,
        payout_status = 'pending',
        paid_at = null
      where reservation_id = p_reservation_id and partner_id = v_partner_id;
    else
      update reservation_shares set
        ownership_percent_snapshot = v_ownership_percent
      where reservation_id = p_reservation_id and partner_id = v_partner_id;
    end if;
  end loop;
end;
$$;
