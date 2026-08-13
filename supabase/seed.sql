-- Seed reference data only (partners + property_settings). Do NOT seed `profiles` here —
-- that requires the real auth.users UUIDs, which only exist after the 5 auth users are created
-- in the Supabase dashboard. See README "Setup" section for the profiles seed step.

insert into property_settings (property_name, unit_number, property_price, transaction_fee, total_acquisition_cost)
values ('Makkah Apartment', '254', 2020070.50, 101003.53, 2121074.03);

insert into partners (name, ownership_percent, capital_contributed, display_order) values
  ('Salman', 42.928111, 910537.01, 1),
  ('Hakeem', 42.928111, 910537.01, 2),
  ('Abdulaziz', 9.429185, 200000.00, 3),
  ('Basmah', 4.714593, 100000.00, 4);
