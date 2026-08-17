# Makkah Apartment Portal

A light, mobile-friendly, bilingual (Arabic/English) portal for tracking rental reservations
and partner payouts for the Makkah apartment (unit 254), replacing the Excel tracking sheet.

**Single-owner tool:** one shared password gates the whole app (no per-person accounts, no
email/magic-link). Salman adds reservations manually; the 4 partners' shares and payout status
are tracked automatically, and each partner's history/totals can be exported as a CSV to share
with them directly.

Every reservation's net amount (rent − manager's commission − cleaning/maintenance expense) is
split among the 4 partners by fixed ownership percentages, computed from capital contributed
toward the property's total acquisition cost:

| Partner | Ownership % |
|---|---|
| Salman | 42.928111% |
| Hakeem | 42.928111% |
| Abdulaziz | 9.429185% |
| Basmah | 4.714593% |

Stack: Next.js (App Router) + Supabase (Postgres only, service-role access — no Supabase Auth) +
Tailwind CSS, deployed on Vercel.

## Setup

### 1. Create a Supabase project

Sign up at [supabase.com](https://supabase.com) and create a new project.

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role key, from Supabase Settings -> API>
APP_PASSWORD=<pick a password to log into the app>
SESSION_SECRET=<any long random string, e.g. `openssl rand -hex 32`>
```

There's no Supabase Auth involved — the app connects to Postgres with the service-role key
server-side only, and `APP_PASSWORD`/`SESSION_SECRET` are entirely this app's own login gate.

### 3. Run the database migrations

In the Supabase dashboard, open **SQL Editor** and run each file in `supabase/migrations/` in
order (`0001_init.sql`, `0002_reservations.sql`, `0003_functions.sql`, `0004_rls.sql`), then run
`supabase/seed.sql`.

**Optional:** `supabase/seed_historical_reservations.sql` imports the 16 real reservations from
the original Excel sheet ("عملاء الأستاذ سلمان"), with partner shares computed at the confirmed
ownership %. Its totals (89 nights, 37,550 SAR rent, 3,450 SAR commission, 30,841 SAR net) were
checked against that sheet's own summary tab before writing it. Run it once, after `seed.sql`.

The `profiles` table and role columns still exist in the schema but aren't used by the app
anymore (the whole app is single-owner) — safe to ignore.

### 4. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — it redirects to `/ar` by default, then to the login page.
Log in with `APP_PASSWORD`.

### 5. Deploy

Push this repo to GitHub, import it into a Vercel project, and add the same 4 environment
variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_PASSWORD`,
`SESSION_SECRET`) in the Vercel project settings, for Production/Preview/Development.

## What's tracked per reservation

Guest name, booking source (direct/Airbnb/Booking.com/other), check-in/out dates, rent amount,
amount collected from the guest so far, the property manager's commission (entered as a flat SAR
amount, matching how it's actually charged), cleaning/maintenance expenses with an itemized note,
and the resulting net amount — which is what gets split among the 4 partners. Each partner's
share can be marked paid/pending once the money is actually transferred by bank transfer; the
app only records status, it never moves money itself.

Each partner's detail page has an **Export CSV** link — their full reservation/payout history,
downloadable to send them directly (WhatsApp, email, etc.).

## Not built yet (intentionally deferred)

- PDF statement export (CSV only for now).
- Automatically netting the monthly bills (internet/electricity/other, tracked on the dashboard
  for visibility) against partner payouts — partner shares are currently per-reservation only.

## Testing

```bash
npm run test    # lib/finance.ts unit tests (fee/net/share-split math)
npm run build   # type-check + production build
npm run lint
```
