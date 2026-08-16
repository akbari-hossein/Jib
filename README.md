# جیب (Jib)

**بدون دردسر بفهم چقدر پول می‌تونی خرج کنی.**

Jib is a Persian, RTL personal-finance PWA. It answers one question on the home screen: how much you can spend today — after liquid balances, upcoming bills, and savings goals.

The product is designed for Iran: Jalali calendar, Tehran timezone, Iranian mobile OTP, and amounts in تومان.

---

## Features

- **Spendable today** — available money and a daily share until the next payday
- **Quick add** — log an expense, income, or transfer from a keypad drawer
- **Accounts** — cash, bank, card, savings; choose which ones count toward available money
- **Budgets** — monthly Jalali budgets with per-category limits and usage status
- **Goals** — savings targets, optional linked accounts, progress toward a date
- **Recurring** — weekly, monthly, or yearly income and expenses
- **Category rules** — auto-categorize by merchant or note (exact / contains)
- **Reports** — calm weekly and monthly reviews, category spend, budget performance
- **PWA** — installable, standalone, with an offline fallback page
- **Auth** — Iranian mobile number + 5-digit OTP, cookie sessions

The free plan is the current product. A `PRO` plan exists in the schema but is not billed yet.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| App | [Next.js](https://nextjs.org/) 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| UI | Tailwind CSS 4, Radix Slot, Vaul drawers, Lucide, Vazirmatn |
| Data | PostgreSQL 16, Prisma 6 |
| Auth | Phone OTP, hashed session cookies |
| Dates | Jalali via `jalaali-js`, all “today” math in `Asia/Tehran` |
| Money | `BigInt` amounts (toman, no decimals) |
| Tests | Vitest |
| Deploy shape | Node server (`next start`) + Postgres |

---

## Architecture

```
src/
  app/                 Routes: marketing, auth, app shell, PWA manifest
  components/          Shared UI, layout, PWA, money display
  features/            Screen-level views (dashboard, budgets, reports, …)
  lib/                 Pure helpers: finance, dates, auth, currency, validation
  server/
    actions/           Next.js server actions (mutations)
    queries/           Data loaders for pages
    services/          Shared domain helpers (ownership, default categories)
prisma/                Schema and migrations
tests/                 Unit tests for finance, dates, auth, money
```

**Money math stays in `src/lib/finance`.** Pages load snapshots; they do not invent formulas. Available money is:

```
liquid accounts
− unlinked goal balances
− recurring expenses due before next income
− required savings this cycle
= spendable now
```

Daily allowance splits that remainder across remaining days in the income cycle, then subtracts what you already spent today.

**Dates are Tehran/Jalali.** Budgets are keyed by Jalali year/month. Recurring “next run” and payday cycles use Tehran local time, not the server’s TZ.

**Auth is cookie-based.** `src/proxy.ts` redirects unauthenticated users away from `/home`, `/transactions`, `/budgets`, `/goals`, `/accounts`, `/rules`, `/recurring`, `/reports`, and `/more`.

---

## Prerequisites

- Node.js 20+
- npm
- Docker (for local Postgres), or any PostgreSQL 16 instance

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/akbari-hossein/Jib.git
cd Jib
npm install
```

`postinstall` runs `prisma generate`.

### 2. Environment

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `OTP_PEPPER` | Secret mixed into OTP and session hashes. Use a long random string (16+ chars). |
| `SMS_PROVIDER` | Currently only `mock` is implemented. In development the OTP is returned to the UI and logged. |

Example `.env`:

```env
DATABASE_URL="postgresql://jib:jib@localhost:5432/jib"
OTP_PEPPER="replace-with-a-long-random-string"
SMS_PROVIDER="mock"
```

### 3. Database

Start Postgres:

```bash
docker compose up -d
```

Apply migrations:

```bash
npm run db:migrate
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Sign in with any valid Iranian mobile number (e.g. `09123456789`). In development, the 5-digit OTP is shown on the verify screen and printed to the server log as `[jib:sms]`.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest, once |
| `npm run test:watch` | Vitest watch mode |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:deploy` | Apply migrations (production) |

---

## App routes

| Path | Who | What |
| --- | --- | --- |
| `/` | Public | Landing |
| `/features`, `/pricing` | Public | Marketing |
| `/login`, `/verify` | Auth | Phone OTP |
| `/home` | Signed in | Spendable today + recent activity |
| `/transactions` | Signed in | Ledger |
| `/budgets` | Signed in | This Jalali month |
| `/goals` | Signed in | Savings goals |
| `/accounts` | Signed in | Wallets and balances |
| `/recurring` | Signed in | Repeating income/expense |
| `/rules` | Signed in | Auto-categorization |
| `/reports` | Signed in | Week / month review |
| `/more` | Signed in | Payday, profile, theme, logout |
| `/offline` | PWA | Cached fallback when the network is down |

---

## Data model (short)

Prisma lives in `prisma/schema.prisma`. The main entities:

- **User** — phone, optional name, payday, locale `fa-IR`, currency `TOMAN`
- **Account** — type, balance, `includeInAvailable`
- **Category** — system defaults seeded on first login (essential / living / lifestyle / financial)
- **Transaction** — expense, income, or transfer; Jalali-aware `occurredAt`
- **Budget** + **BudgetCategory** — unique per user + Jalali year/month
- **Goal** — target, current amount, optional account
- **RecurringTransaction** — frequency, `nextRunAt`, day-of-month
- **TransactionRule** — match merchant/note → category
- **Session** / **OtpChallenge** — hashed tokens, expiry, attempt limits

Amounts are `BigInt` (whole toman). Never use floating-point for money.

---

## Testing

Finance formulas, Jalali helpers, phone parsing, and money validation are covered by unit tests under `tests/`.

```bash
npm test
```

When you change spendable-today, budgets, goals, or reports, add or update tests in `tests/finance/` rather than asserting UI copy.

---

## Production notes

- Set a strong unique `OTP_PEPPER`. Rotating it invalidates existing sessions and unused OTPs.
- Point `DATABASE_URL` at a managed Postgres and run `npm run db:deploy` on release.
- SMS is still a mock. Wire a real provider in `src/lib/sms` before exposing login beyond development.
- Sessions last 30 days; OTPs expire in 5 minutes and allow 5 attempts. Send rate limits live in `src/lib/auth/rate-limit.ts`.
- The service worker caches `/offline` only. Treat the PWA as an installable shell, not a full offline ledger.

---

## Product principles

1. **One number first** — available money and today’s share, not a spreadsheet.
2. **Quick capture** — logging a spend should take seconds.
3. **Calm copy** — no shame language when someone goes over budget.
4. **Private by default** — data is per-user; no ads in the product UI.
5. **Iran-native** — RTL, Jalali, تومان, Iranian mobile numbers.
