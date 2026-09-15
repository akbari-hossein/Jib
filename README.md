# جیب (Jib)

**بدون دردسر بفهم چقدر پول می‌تونی خرج کنی.**

Jib is a Persian, RTL personal-finance PWA. It answers one question on the home screen: how much you can spend today — after liquid balances, upcoming bills, and savings goals.

The product is designed for Iran: Jalali calendar, Tehran timezone, and amounts in تومان. New accounts get a 14-day trial; after that, writing data requires a 59,000 Toman/month card-to-card subscription.

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
- **Notifications** — deterministic, explainable nudges (budget thresholds, recurring due, goal milestones) via Web Push and an in-app center
- **PWA** — installable, standalone, with an offline fallback page
- **Auth** — email and password, optional Google sign-in, cookie sessions

---

## Tech stack

| Layer | Choice |
| --- | --- |
| App | [Next.js](https://nextjs.org/) 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| UI | Tailwind CSS 4, Radix Slot, Vaul drawers, Lucide, Vazirmatn |
| Data | PostgreSQL 16, Prisma 6 |
| Auth | Email/password + Google OAuth, hashed session cookies |
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

**Auth is cookie-based.** `src/proxy.ts` redirects unauthenticated users away from `/home`, `/transactions`, `/budgets`, `/goals`, `/accounts`, `/rules`, `/recurring`, `/reports`, `/notifications`, `/settings`, and `/more`.

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
| `AUTH_SECRET` | Secret mixed into session hashes. Use a long random string (16+ chars). |
| `GOOGLE_CLIENT_ID` | Optional. Google OAuth client ID. Leave empty to hide Google sign-in. |
| `GOOGLE_CLIENT_SECRET` | Optional. Google OAuth client secret. |
| `GOOGLE_REDIRECT_URI` | Optional. Defaults to `{origin}/api/auth/google/callback`. |
| `CRON_SECRET` | Shared secret for `GET /api/cron/notifications`. Required in production (16+ chars). |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push public key. Generate with `npx web-push generate-vapid-keys`. |
| `VAPID_PRIVATE_KEY` | Web Push private key. Keep this on the server only. |
| `VAPID_SUBJECT` | Optional. `mailto:` or site URL used in VAPID claims. |
| `JIB_DESTINATION_CARD_NUMBER` | 16-digit card number shown for card-to-card subscription payments. |
| `TELEGRAM_BOT_TOKEN` | Optional. Telegram bot token for new-receipt admin alerts. |
| `TELEGRAM_ADMIN_CHAT_ID` | Optional. Telegram chat that receives receipt alerts. |
| `JIB_SUBSCRIPTION_PRICE_TOMAN` | Optional. Monthly price; defaults to 59000. |
| `ADMIN_BOOTSTRAP_EMAILS` | First admin bootstrap if no ADMIN users exist. |

Example `.env`:

```env
DATABASE_URL="postgresql://jib:jib@localhost:5432/jib"
AUTH_SECRET="replace-with-a-long-random-string"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Web Push is optional. If VAPID keys are missing, the in-app notification center still works.

---

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

Create an account at `/signup` with email and password (at least 8 characters). To enable Google sign-in, create OAuth credentials in Google Cloud and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. The authorized redirect URI is `http://localhost:3000/api/auth/google/callback`.

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
| `/features` | Public | Marketing |
| `/login`, `/signup` | Auth | Email/password and optional Google |
| `/home` | Signed in | Spendable today + recent activity |
| `/transactions` | Signed in | Ledger |
| `/budgets` | Signed in | This Jalali month |
| `/goals` | Signed in | Savings goals |
| `/accounts` | Signed in | Wallets and balances |
| `/recurring` | Signed in | Repeating income/expense |
| `/rules` | Signed in | Auto-categorization |
| `/reports` | Signed in | Week / month review |
| `/notifications` | Signed in | In-app notification center |
| `/settings/notifications` | Signed in | Toggle rules, quiet hours, Web Push |
| `/more` | Signed in | Payday, profile, theme, logout |
| `/offline` | PWA | Cached fallback when the network is down |

---

## Data model (short)

Prisma lives in `prisma/schema.prisma`. The main entities:

- **User** — email, optional password hash, optional Google id, optional name, payday, locale `fa-IR`, currency `TOMAN`
- **Account** — type, balance, `includeInAvailable`
- **Category** — system defaults seeded on first login (essential / living / lifestyle / financial)
- **Transaction** — expense, income, or transfer; Jalali-aware `occurredAt`
- **Budget** + **BudgetCategory** — unique per user + Jalali year/month
- **Goal** — target, current amount, optional account
- **RecurringTransaction** — frequency, `nextRunAt`, day-of-month
- **TransactionRule** — match merchant/note → category
- **NotificationRule** — system-defined, seeded triggers (not user-editable)
- **UserNotificationSetting** — per-user enable/channel for each rule
- **NotificationLog** — sent history and idempotency (`dedupeKey`)
- **PushSubscription** — Web Push endpoints
- **Session** — hashed tokens and expiry

Amounts are `BigInt` (whole toman). Never use floating-point for money.

---

## Testing

Finance formulas, Jalali helpers, auth validation, and money validation are covered by unit tests under `tests/`.

```bash
npm test
```

When you change spendable-today, budgets, goals, reports, or notification rules, add or update tests in `tests/finance/` rather than asserting UI copy.

---

## Calendar holidays

Official Iranian holidays on the month calendar are a static, developer-maintained file: `src/lib/dates/iranian-holidays.ts`. The snapshot is vendored from [samanzamani/PersianHoliday](https://github.com/samanzamani/PersianHoliday) (mined from time.ir). **Refresh that file manually once a year** when the next official Jalali calendar is published — there is no live API call and no yearly sync job.

---

## Production notes

- Set a strong unique `AUTH_SECRET`. Rotating it invalidates existing sessions.
- Point `DATABASE_URL` at a managed Postgres and run `npm run db:deploy` on release.
- For Google sign-in, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and add the callback URL in Google Cloud (`https://your-domain/api/auth/google/callback`).
- Sessions last 30 days. Login and signup rate limits live in `src/lib/auth/rate-limit.ts`.
- The service worker caches `/offline` only. Treat the PWA as an installable shell, not a full offline ledger.
- Notifications are evaluated hourly at `GET /api/cron/notifications`. On Vercel, `vercel.json` schedules that path. Self-hosted:

  ```bash
  npx web-push generate-vapid-keys
  # put the public key in NEXT_PUBLIC_VAPID_PUBLIC_KEY and the private key in VAPID_PRIVATE_KEY

  crontab -e
  # every hour:
  0 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/notifications
  ```

  Without VAPID keys, Web Push is skipped and the in-app center still records every fired rule. `CRON_SECRET` must be set in production (16+ characters).

---

## Product principles

1. **One number first** — available money and today’s share, not a spreadsheet.
2. **Quick capture** — logging a spend should take seconds.
3. **Calm copy** — no shame language when someone goes over budget.
4. **Private by default** — data is per-user; no ads in the product UI.
5. **Iran-native** — RTL, Jalali, تومان.
