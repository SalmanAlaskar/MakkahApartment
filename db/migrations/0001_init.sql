-- Core reference data (roles, partners, property acquisition info) plus identity: Auth.js owns
-- the `users`/`accounts`/`sessions`/`verification_token` tables (schema fixed by @auth/pg-adapter,
-- see node_modules/@auth/pg-adapter), with `role` and `partner_id` bolted directly onto `users`
-- since there's a single source of user identity now (no separate Supabase Auth + profiles split).
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

-- Auth.js adapter tables. Column names/casing (e.g. "emailVerified", "userId") must match
-- @auth/pg-adapter's queries exactly -- it's a fixed schema, not ours to rename.
create table users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  "emailVerified" timestamptz,
  image text,
  role user_role not null default 'partner',
  partner_id uuid references partners(id),
  created_at timestamptz not null default now()
);

create index idx_users_partner_id on users(partner_id);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references users(id) on delete cascade,
  type varchar(255) not null,
  provider varchar(255) not null,
  "providerAccountId" varchar(255) not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  id_token text,
  scope text,
  session_state text,
  token_type text
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references users(id) on delete cascade,
  expires timestamptz not null,
  "sessionToken" varchar(255) not null unique
);

create table verification_token (
  identifier text not null,
  expires timestamptz not null,
  token text not null,
  primary key (identifier, token)
);
