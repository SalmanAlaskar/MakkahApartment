-- Single-row table holding the app's shared login password and recovery code,
-- both stored as salted scrypt hashes (see lib/credentials.ts). Moving these out
-- of env vars into the database is what makes self-service change/reset possible:
-- a running serverless function can update a database row, but it cannot write
-- back to its own process environment.
create table if not exists app_credentials (
  id boolean primary key default true,
  password_hash text not null,
  recovery_code_hash text not null,
  updated_at timestamptz not null default now(),
  constraint app_credentials_singleton check (id)
);

alter table app_credentials enable row level security;

-- Seed the current login password and a fresh recovery code so the app keeps
-- working immediately after this migration runs. The password hash below
-- corresponds to the password already in use; the recovery code is new.
insert into app_credentials (id, password_hash, recovery_code_hash)
values (
  true,
  'c275f5cb7079b72b798f94f91593ac99:d55e547dbe6f0bc266b78bbd2c82ea07b949f87da69d6e2470b693f85aa79e96451940a2a8511d540b170818d4c387ee48d3fc0c5890ad5cb37991832653027c',
  '897bda089dbc563bb58ff2fd87e23f96:c9a2a9694410d427dd91ac7c018e9680f316bb5aa4c64ff0e43248ccc8b9c17e7cfe81bd0d39f6a1195e175a810f3bf439fff1adad1364b40cf9ec5524c17100'
)
on conflict (id) do nothing;
