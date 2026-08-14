-- Reservations, per-partner share snapshots, and simple monthly recurring bills.
create type reservation_status as enum ('confirmed', 'cancelled', 'completed');
create type fee_method as enum ('flat_amount', 'percent_of_gross');
create type payout_status as enum ('pending', 'paid');

create table reservations (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  platform text not null default 'direct',        -- 'direct' | 'airbnb' | 'booking' | 'other' (free text, not enum)
  rental_type text not null default 'daily',       -- 'daily' | 'monthly'
  check_in date not null,
  check_out date not null,
  gross_amount numeric(12, 2) not null,
  paid_amount numeric(12, 2) not null default 0,   -- amount collected from the guest so far
  payment_method text,                             -- 'cash' | 'bank_transfer' | other, free text
  fee_method fee_method not null default 'flat_amount',
  fee_percent numeric(6, 3),                       -- set when fee_method = 'percent_of_gross'
  fee_amount numeric(12, 2) not null,               -- always stored, regardless of method
  expense_amount numeric(12, 2) not null default 0, -- cleaning/maintenance costs for this reservation
  expense_note text,                                -- itemized breakdown, e.g. "cleaning 100 + linen wash 36"
  net_amount numeric(12, 2) not null,                -- gross_amount - fee_amount - expense_amount
  status reservation_status not null default 'confirmed',
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_out_after_check_in check (check_out > check_in),
  constraint gross_amount_nonneg check (gross_amount >= 0),
  constraint fee_amount_nonneg check (fee_amount >= 0),
  constraint expense_amount_nonneg check (expense_amount >= 0),
  constraint paid_amount_nonneg check (paid_amount >= 0)
);

create index idx_reservations_check_in on reservations(check_in desc);

-- Snapshot of each partner's share of each reservation's net_amount, at the ownership % in effect
-- at write time. Deliberately decoupled from live partners.ownership_percent so historical
-- splits survive any future renegotiation of ownership shares.
create table reservation_shares (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  partner_id uuid not null references partners(id),
  ownership_percent_snapshot numeric(9, 6) not null,
  share_amount numeric(12, 2) not null,
  payout_status payout_status not null default 'pending',
  paid_at timestamptz,
  paid_note text,
  created_at timestamptz not null default now(),
  unique (reservation_id, partner_id)
);

create index idx_reservation_shares_partner on reservation_shares(partner_id);
create index idx_reservation_shares_reservation on reservation_shares(reservation_id);

-- Simple monthly recurring bills (internet/electricity/other) for informational tracking on the
-- dashboard, and (via monthly_expense_shares, see 0003) netted against partner payouts.
create table monthly_expenses (
  id uuid primary key default gen_random_uuid(),
  month date not null,                              -- always the 1st of the month
  internet_bill numeric(10, 2) not null default 0,
  electricity_bill numeric(10, 2) not null default 0,
  other_expense numeric(10, 2) not null default 0,
  other_expense_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (month)
);
