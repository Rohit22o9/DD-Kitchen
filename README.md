# Daily Drop — Commercial Kitchen & Storage Platform (v2, hardened)

Booking platform for Daily Drop Commercial Kitchens, Victoria Park, Perth WA.

- **Frontend:** React 19 + TypeScript + Vite + Tailwind (`/frontend`)
- **Backend:** Node.js + Express + MongoDB (Mongoose), layered as routes → controllers → services → models (`/backend`)
- **Integrations:** Google Sheets reporting + customer emails via a secret-protected Apps Script webhook; optional Gemini finance assistant (server-side only)

This is a hardened rewrite of the original prototype. Every issue from the production-readiness review is listed in **[FIXES.md](FIXES.md)** with the change that fixed it and the test that proves it.

---

## How it works

| Concern | Design |
|---|---|
| Source of truth | MongoDB only. The browser holds a login token and nothing else. The Google Sheet is a downstream report. |
| Double-booking | Each booking claims 30-minute slot documents under a **unique index**, inside a transaction. Two bookings (or a booking and a maintenance block) can never own the same slot. Tested with 20 simultaneous requests → exactly 1 succeeds. |
| Time | Business dates/times are Perth wall-clock strings for display, and every booking also stores UTC `start_at`/`end_at`. Overnight shifts, "is it in the past" and next-day availability use absolute time. WA has no daylight saving (always UTC+08:00). |
| Pricing | Kitchen: package/hourly prices **ex GST** from the admin-editable config, +10% GST. Storage: **GST-inclusive** rates. Money is stored in integer cents. The website renders prices from `GET /api/config`; the server prices every booking itself. |
| Holds | New requests hold their slot for `BOOKING_HOLD_HOURS` (default 48) or until the shift starts. Unpaid holds expire automatically and free the slot. |
| Payments | Bank transfer / PayID. Staff record a payment (with the bank reference); that marks the tax invoice paid, confirms the booking and issues a per-booking door code shown only to that customer. |
| Tax invoices | Persisted, sequential (`INV-2026-00001`), never renumbered. Seller name/ABN snapshotted at issue, issue date = actual date of issue, GST per line, refundable bond shown separately and excluded from GST. Buyer ABN printed only if the customer gave a valid one. |
| Roles | `hirer`, `staff_admin`, `super_admin` — stored on the user record and re-read from the database on every request. Finance routes are super-admin only. |
| Sheets/email sync | Transactional outbox: jobs are written in the same transaction as the booking, then delivered by a background worker with timeouts, retries and backoff. Requests never wait on Google. |

---

## Local development

Requirements: Node 20+ (22 recommended).

```bash
# 1. API
cd backend
cp .env.example .env          # USE_IN_MEMORY_DB=true is fine for local work
npm install
npm run seed:demo             # prints demo hirer / staff / director logins (random passwords)
npm run dev                   # http://localhost:8000/api/health

# 2. Website (new terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173  (proxies /api to :8000)
```

Portals: `http://localhost:5173/#admin` (staff), `#superadmin` (finance), `#customer` (hirers).

> With `USE_IN_MEMORY_DB=true` the first start downloads a MongoDB binary and data is lost on restart. For persistent local data point `MONGODB_URI` at a replica set (Atlas free tier works).

### Tests

```bash
cd backend && npm test                 # 54 tests against a real MongoDB replica set
cd frontend && npm run build && npm run lint

# UI smoke tests: mount the real app against a running API
SMOKE_API=http://127.0.0.1:8000/api \
SMOKE_STAFF='staff@example.test:<password>' SMOKE_DIRECTOR='director@example.test:<password>' \
  npx vitest run
```

CI (`.github/workflows/ci.yml`) runs all three on every push and pull request.

---

## Production deployment

### 1. Database
MongoDB Atlas (any tier; it's a replica set, which transactions require). Create a database user with access to one database, and restrict Network Access to your API host's egress IPs.

If you are moving from the v1 database, run the migration **once**, dry-run first:

```bash
cd backend
DRY_RUN=true npm run migrate:v2   # reports conflicts / orphaned records
npm run migrate:v2
```

It converts v1 bookings and storage leases, removes the shared door PIN, archives v1 invoices, reports any existing double-bookings, and locks the v1 seed accounts whose passwords were published in the old repo.

### 2. API
**Quickest:** on Render, *New → Blueprint* and pick this repo; `render.yaml` creates the API and website and generates `JWT_SECRET` / `ENCRYPTION_KEY`. Fill in the values it asks for.

Or deploy `/backend` (a `Dockerfile` is included) to any Node host — Railway, Fly.io, a VPS. Set environment variables from `backend/.env.example`. Required in production:

| Variable | Notes |
|---|---|
| `NODE_ENV=production` | |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | 32+ random chars: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `SELLER_ABN` | Daily Drop's real ABN (checksum validated at startup) |
| `CORS_ORIGINS` | The website's origin, e.g. `https://www.dailydrop.today` |
| `TRUST_PROXY` | `1` behind a single load balancer |
| `PAYMENT_*` | **Verify against the actual bank account.** Leave blank to hide payment details. |
| `APP_URL` | Website URL (https) used in emailed links |
| `SMTP_URL`, `EMAIL_FROM` | Email delivery, e.g. `smtps://user:pass@smtp.example.com:465` (or use the Apps Script webhook) |
| `REQUIRE_ADMIN_2FA` | `true` — staff must enrol an authenticator app |
| `REQUIRE_EMAIL_VERIFICATION` | `true` to block bookings until the email is confirmed (needs SMTP or webhook) |
| `ENCRYPTION_KEY` | 32+ random chars; encrypts 2FA secrets |
| `RATE_LIMIT_STORE` | `mongo` (default in production) shares limits across instances |

The server refuses to start if a required value is missing or invalid.

Create staff accounts (passwords come from the environment, never the command line):

```bash
ADMIN_EMAIL=director@dailydrop.today ADMIN_PASSWORD='<12+ chars>' ADMIN_ROLE=super_admin npm run create-admin
ADMIN_EMAIL=ops@dailydrop.today      ADMIN_PASSWORD='<12+ chars>' ADMIN_ROLE=staff_admin npm run create-admin
```

Add `ADMIN_TOTP=true` to enrol two-factor at the same time (prints the key / `otpauth://` link to scan). Otherwise staff are asked to set it up at first sign-in when `REQUIRE_ADMIN_2FA=true`.

### 3. Google Sheets + emails (optional)
Follow the header of `google-apps-script.js`: paste it into Apps Script, set the `WEBHOOK_SECRET` script property, deploy a **new** web app, then set `GOOGLE_SHEET_WEBHOOK_URL` and `GOOGLE_SHEET_WEBHOOK_SECRET` on the API. **Archive the old deployment** — its URL is public in the original repository and returns all customer data.

### 4. Website
Either host `/frontend/dist` anywhere static (Netlify, Vercel, S3/CloudFront, Pages), building with `VITE_API_BASE_URL=https://<your-api>/api`, or use the manual **Deploy website to GitHub Pages** workflow after setting the `VITE_API_BASE_URL` repository variable.

---

## Before going live — operational checklist

- [ ] Change the physical keypad code if `4892#` was ever real (it was published in the original repo).
- [ ] Archive the old Apps Script deployment and rotate any Gemini key that was ever set in the old frontend.
- [ ] Confirm `SELLER_ABN`, legal name and `PAYMENT_*` details with the business's accountant/bank.
- [ ] Have the Terms & Conditions and privacy policy reviewed; bump `TERMS_VERSION` when they change.
- [ ] Program door codes: the API issues a random 6-digit code per paid booking (or staff can set one). Either enter it on the keypad or integrate the keypad's API.
- [ ] Set up Atlas backups and an uptime monitor on `/api/health`.
- [ ] Configure SMTP with SPF/DKIM for the sender domain, then turn on `REQUIRE_EMAIL_VERIFICATION`.

## Staff features

- **Approvals:** set a door code and payment reference when approving; reject or cancel storage requests.
- **Finance portal:** mark paid, **Refund** (issues an adjustment note), **Settle** bonds, **Import bank CSV** to reconcile payments.
- **Settings:** edit kitchen packages, set up two-factor.
- **Customers:** searchable directory of real accounts.

## Project layout

```
backend/
  src/
    app.js, server.js          Express app (helmet, CORS allowlist, rate limits) and process lifecycle
    config/                    env validation, DB connection, business constants
    routes/index.js            every route and its guard in one place
    middlewares/               auth (JWT + DB role), zod validation, rate limiting, error handling
    controllers/               HTTP layer only
    services/                  booking, storage, pricing, invoices, outbox, Gemini, documents, jobs
    models/                    Mongoose schemas (Booking, BookingSlot, Invoice, Counter, OutboxJob, ...)
    scripts/                   create-admin, seed:demo, migrate:v2
  test/                        node:test + supertest against a real replica set
frontend/
  src/services/api.ts          thin typed API client (no local database, no secrets)
  src/components/              UI
  src/__tests__/               UI smoke tests
google-apps-script.js          Sheets/email webhook (secret-protected, no data over GET)
```
