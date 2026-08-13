-- Core reference data: roles, partners (fixed ownership %), property acquisition info.
create extension if not exists pgcrypto;

create type user_role as enum ('admin', 'manager', 'partner');

create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ownership_percent numeric(9, 6) not null,
  capital_contributed numeric(14, 2) not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint ownership_percent_range check (ownership_percent >= 0 and ownership_percent <= 100)
);

create table property_settings (
  id uuid primary key default gen_random_uuid(),
  property_name text not null default 'Makkah Apartment',
  unit_number text,
  property_price numeric(14, 2) not null,
  transaction_fee numeric(14, 2) not null,
  total_acquisition_cost numeric(14, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per Supabase auth user. Seeded manually after the 5 auth users exist (see README setup steps).
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null,
  partner_id uuid references partners(id),
  created_at timestamptz not null default now()
);

create index idx_profiles_partner_id on profiles(partner_id);
