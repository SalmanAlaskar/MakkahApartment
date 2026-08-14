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

Stack: Next.js (App Router) + Postgres (any provider — [Neon](https://neon.tech)'s free tier is
the easy pick) + [Auth.js](https://authjs.dev) (passwordless magic-link login via
[Resend](https://resend.com)'s free tier) + Tailwind CSS, deployed on Vercel. There is no
Supabase, no vendor-specific database client, and no row-level security — every query runs
through a single trusted Postgres connection from server-only code (Server Components/Actions),
and every access check lives in `lib/auth.ts`, enforced before each query.

## Setup

### 1. Create a free Postgres database

Sign up at [neon.tech](https://neon.tech) (or any Postgres host — Neon is just the easiest free
option that pairs well with Vercel) and create a project. Copy its connection string — use the
**pooled** connection string if Neon offers one, since Vercel's serverless functions open many
short-lived connections.

### 2. Create a free Resend account (for magic-link emails)

Sign up at [resend.com](https://resend.com) and grab an API key from **API Keys**. Without
verifying your own sending domain, Resend's shared `onboarding@resend.dev` sender only delivers to
the email address on your own Resend account — fine for testing as just you, but to actually reach
Hakeem, Abdulaziz, Basmah, and the property manager you'll need to
[verify a domain](https://resend.com/domains) in Resend and use an address at that domain as
`AUTH_EMAIL_FROM` below.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
AUTH_SECRET=            # generate with: npx auth secret
AUTH_RESEND_KEY=re_xxxxxxxxxxxx
AUTH_EMAIL_FROM="Makkah Apartment <onboarding@resend.dev>"
ADMIN_EMAIL=you@example.com   # whichever email should become admin on first sign-in
```

### 4. Run the database migrations

Using `psql` (or any SQL client) pointed at your `DATABASE_URL`, run each file in
`db/migrations/` in order (`0001_init.sql`, `0002_reservations.sql`,
`0003_monthly_expense_shares.sql`), then run `db/seed.sql`:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_init.sql
psql "$DATABASE_URL" -f db/migrations/0002_reservations.sql
psql "$DATABASE_URL" -f db/migrations/0003_monthly_expense_shares.sql
psql "$DATABASE_URL" -f db/seed.sql
```

**Optional:** `db/seed_historical_reservations.sql` imports the 16 real reservations from the
original Excel sheet ("عملاء الأستاذ سلمان"), with partner shares computed at the confirmed
ownership %. Its totals (89 nights, 37,550 SAR rent, 3,450 SAR commission, 30,841 SAR net) were
checked against that sheet's own summary tab before writing it, so the numbers are exactly what
was already being tracked — just now split per partner. Run it once, after `seed.sql`.

### 5. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — it redirects to `/ar` by default (toggle to English from the nav
once logged in). Sign in with the email you set as `ADMIN_EMAIL` — that account becomes admin
automatically the first time it signs in. Everyone else who signs in lands as a plain "partner"
with no role or linked partner assigned; once you're in as admin, set each person's role and
linked partner at **Settings → Users**. There's no separate auth dashboard step and no UUIDs to
copy — signing in once is what creates a person's account.

### 6. Deploy

Push this repo to GitHub, import it into a new Vercel project, and add the same environment
variables (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`, `ADMIN_EMAIL`) in
the Vercel project settings.

## What's tracked per reservation

Guest name, booking source (direct/Airbnb/Booking.com/other), check-in/out dates, rent amount,
amount collected from the guest so far, the property manager's commission (entered as a flat SAR
amount, matching how it's actually charged), cleaning/maintenance expenses with an itemized note,
and the resulting net amount — which is what gets split among the 4 partners. Each partner's
share can be marked paid/pending independently (admin-only) once you actually transfer their
money by bank transfer; the app only records status, it never moves money itself.

The property manager can see gross/commission/net totals for their own bookings, but not the
per-partner breakdown — that stays visible to the 4 partners and admin only.

## Monthly bills

Admin enters each month's internet/electricity/other bills at **Settings → Monthly bills**. Saving
a month splits its total across the 4 partners by ownership % (same math as reservation shares)
and tracks each partner's portion as pending/paid, independently of reservation payouts. Every
pending bill share is netted against that partner's pending reservation payouts wherever a payout
total is shown (dashboard, partners list, partner detail) — so what's displayed as owed to a
partner is already net of bills they haven't settled yet. Re-saving a month for a partner whose
split amount changed resets that partner's status back to pending, same as editing a reservation.

## Not built yet (intentionally deferred)

- Importing the historical Excel data (the reservation fields already match its columns, so this
  is a straightforward future addition, not a schema change).
- CSV/PDF statement export.

## Testing

```bash
npm run test    # lib/finance.ts unit tests (fee/net/share-split math)
npm run build   # type-check + production build
npm run lint
```
