-- Row Level Security. This is the real authorization boundary — UI-level role checks are
-- convenience/UX only, never trust them alone.

alter table profiles enable row level security;
alter table partners enable row level security;
alter table property_settings enable row level security;
alter table reservations enable row level security;
alter table reservation_shares enable row level security;
alter table monthly_expenses enable row level security;

-- profiles: everyone can read their own row; admin can read/manage all.
create policy profiles_select_own_or_admin on profiles for select
  using (id = auth.uid() or auth_role() = 'admin');
create policy profiles_update_own_or_admin on profiles for update
  using (id = auth.uid() or auth_role() = 'admin');
create policy profiles_insert_admin on profiles for insert
  with check (auth_role() = 'admin');
create policy profiles_delete_admin on profiles for delete
  using (auth_role() = 'admin');

-- partners: visible to every signed-in user (transparency among the ownership circle);
-- only admin edits ownership %/capital.
create policy partners_select_all on partners for select
  using (auth.uid() is not null);
create policy partners_write_admin on partners for all
  using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- property_settings: same shape as partners.
create policy settings_select_all on property_settings for select
  using (auth.uid() is not null);
create policy settings_write_admin on property_settings for all
  using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- reservations: all signed-in users (including manager) can see gross/fee/net — the manager's
-- own bookings and fee are fine for them to see. Only admin/manager can write. Only admin deletes.
create policy reservations_select_all on reservations for select
  using (auth.uid() is not null);
create policy reservations_insert_admin_manager on reservations for insert
  with check (auth_role() in ('admin', 'manager'));
create policy reservations_update_admin_manager on reservations for update
  using (auth_role() in ('admin', 'manager'));
create policy reservations_delete_admin on reservations for delete
  using (auth_role() = 'admin');

-- reservation_shares: this is exactly the per-partner breakdown that must stay hidden from the
-- manager. SELECT is restricted to admin + partner roles only. Writes go through the
-- create/update_reservation_with_shares() security-definer functions, so no direct
-- insert/update policy is needed for manager; admin keeps direct access for corrections.
create policy shares_select_admin_partner on reservation_shares for select
  using (auth_role() in ('admin', 'partner'));
create policy shares_write_admin on reservation_shares for all
  using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- monthly_expenses: informational, visible to all signed-in users; admin-only writes.
create policy monthly_expenses_select_all on monthly_expenses for select
  using (auth.uid() is not null);
create policy monthly_expenses_write_admin on monthly_expenses for all
  using (auth_role() = 'admin') with check (auth_role() = 'admin');
