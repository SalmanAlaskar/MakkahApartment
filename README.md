# Makkah Apartment Portal

A light, mobile-friendly, bilingual (Arabic/English) portal for tracking rental reservations
and partner payouts for the Makkah apartment (unit 254), replacing the Excel tracking sheet.

**Roles:** admin (Salman), property manager, and 3 partner viewers (Hakeem, Abdulaziz, Basmah).
Every reservation's net amount (rent − manager's commission − cleaning/maintenance expense) is
split among the 4 partners by fixed ownership percentages, computed from capital contributed
toward the property's total acquisition cost:

| Partner | Ownership % |
|---|---|
| Salman | 42.928111% |
| Hakeem | 42.928111% |
| Abdulaziz | 9.429185% |
| Basmah | 4.714593% |

Stack: Next.js (App Router) + Supabase (Postgres + Auth) + Tailwind CSS, deployed on Vercel.

## Setup

### 1. Create a Supabase project

Sign up at [supabase.com](https://supabase.com) and create a new project (any region close to
Saudi Arabia, e.g. `eu-central-1` or `ap-south-1`, works fine).

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the three values from your Supabase
project's **Settings → API** page:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

### 3. Run the database migrations

In the Supabase dashboard, open **SQL Editor** and run each file in `supabase/migrations/` in
order (`0001_init.sql`, `0002_reservations.sql`, `0003_functions.sql`, `0004_rls.sql`), then run
`supabase/seed.sql`. (If you have the Supabase CLI linked to the project instead, `supabase db
push` + running `seed.sql` works too.)

After running the migrations, check **Authentication → Policies** in the dashboard and confirm
RLS shows as enabled on all 6 tables.

### 4. Create the 5 auth users

In **Authentication → Users**, click "Add user" and create one user per person, by email —
login is passwordless (magic link), so no password needs to be set:

- Salman (admin)
- Hakeem (partner)
- Abdulaziz (partner)
- Basmah (partner)
- The property manager (manager)

### 5. Seed the `profiles` table

Once the 5 users exist, copy each one's UUID from the Authentication → Users list, then run this
in the SQL Editor (replace the UUIDs and check the partner names match what's in your `partners`
table — `select id, name from partners;` to confirm):

```sql
insert into profiles (id, full_name, role, partner_id) values
  ('<salman-auth-uuid>', 'Salman', 'admin',   (select id from partners where name = 'Salman')),
  ('<hakeem-auth-uuid>', 'Hakeem', 'partner', (select id from partners where name = 'Hakeem')),
  ('<abdulaziz-auth-uuid>', 'Abdulaziz', 'partner', (select id from partners where name = 'Abdulaziz')),
  ('<basmah-auth-uuid>', 'Basmah', 'partner', (select id from partners where name = 'Basmah')),
  ('<manager-auth-uuid>', 'Property Manager', 'manager', null);
```

(Roles and partner links can later be edited from the app itself at **Settings → Users**, once
logged in as admin.)

### 6. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — it redirects to `/ar` by default (toggle to English from the nav
once logged in).

### 7. Deploy

Push this repo to GitHub, import it into a new Vercel project, and add the same three
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
environment variables in the Vercel project settings.

## What's tracked per reservation

Guest name, booking source (direct/Airbnb/Booking.com/other), check-in/out dates, rent amount,
amount collected from the guest so far, the property manager's commission (entered as a flat SAR
amount, matching how it's actually charged), cleaning/maintenance expenses with an itemized note,
and the resulting net amount — which is what gets split among the 4 partners. Each partner's
share can be marked paid/pending independently (admin-only) once you actually transfer their
money by bank transfer; the app only records status, it never moves money itself.

The property manager can see gross/commission/net totals for their own bookings, but not the
per-partner breakdown — that stays visible to the 4 partners and admin only.

## Not built yet (intentionally deferred)

- Importing the historical Excel data (the reservation fields already match its columns, so this
  is a straightforward future addition, not a schema change).
- CSV/PDF statement export.
- Automatically netting the monthly bills (internet/electricity/other, tracked on the dashboard
  for visibility) against partner payouts — partner shares are currently per-reservation only.

## Testing

```bash
npm run test    # lib/finance.ts unit tests (fee/net/share-split math)
npm run build   # type-check + production build
npm run lint
```
