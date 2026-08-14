-- Nets each month's recurring bills against partner payouts, the same way reservation_shares
-- nets each reservation's net_amount. Split by ownership %, with its own pending/paid tracking so
-- a bill's cost can be settled independently of reservation payouts. Rows are written by
-- lib/actions/monthlyExpenses.ts (a plain INSERT ... ON CONFLICT upsert), not a database function.
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
