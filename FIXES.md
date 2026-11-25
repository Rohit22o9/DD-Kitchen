# Review findings → fixes

Every finding from the production-readiness review of
[`Rohit22o9/DD-Kitchen@c04c973`](https://github.com/Rohit22o9/DD-Kitchen/tree/c04c973), what changed, and how it is verified.
File references marked *(v1)* point at the original repository.

Verification: `backend/test/*.test.js` (54 tests, real MongoDB 8 replica set), `frontend/src/__tests__/smoke.test.tsx`
(UI against a live API), and the probe script results in the PR description.

## P0 — Security

| # | Finding (v1) | Fix | Verified by |
|---|---|---|---|
| 1 | No auth on any `/admin/*`, `/superadmin/*`, `/invoices*`, storage routes; `requireAdmin` defined but never mounted (`adminRoutes.js`, `invoiceRoutes.js`, `storageRoutes.js`) | All routes declared in `routes/index.js` with an explicit guard; finance routes `super_admin` only | `security.test.js`: route table check + every admin route returns 401 without a token, 403 for wrong role |
| 2 | Hard-coded staff logins `admin/admin123`, `superadmin/admin123`… (`adminController.js:20,40`) and more in the browser bundle (`api.ts:920-947`) | Staff log in as real users in the `users` collection; `npm run create-admin` creates them; client-side checks removed | `security.test.js` "v1 hard-coded admin passwords no longer work"; bundle scan |
| 3 | Admin panel opened without login (`AdminDashboard.tsx:85` defaulted token to `'demo_admin_token'`) | No default token; login form until a real login succeeds; auto-logout on 401 | UI smoke "admin portal requires a login" |
| 4 | Any bearer token starting `dd_adm_` was accepted as staff admin (`authMiddleware.js:22`) | Removed. Tokens are HS256 JWTs with issuer/audience; role and token version re-read from the DB on each request | `security.test.js` mock-token, forged-token, role-from-DB tests |
| 5 | JWT secret fell back to a string committed in 3 files and `.env.example` | No fallback. Production refuses to start without a 32+ char secret; dev generates a random one per boot | Startup check (see `config/env.js`) |
| 6 | Admin tokens (`id:'staff-admin-id'`) were incompatible with `verifyToken` — mounting the guard would have locked admins out | Admins are ordinary user documents with a role | `security.test.js` admin login test |
| 7 | Public `/availability` returned customer names and booking references; `/bookings/:ref` returned email, phone, ABN and door PIN to anyone; 5-digit refs enumerable | Availability returns busy intervals only. Booking lookup is owner/admin only. References are 8 random chars (~8.5e11). Door code shown only to the owner after payment | `security.test.js` PII + access-code tests |
| 8 | `/auth/bookings-by-email?email=` returned anyone's bookings | Removed; `/auth/bookings` uses the token's user | `security.test.js` |
| 9 | Same door PIN `4892#` on every booking, published in code and invoice text | Random 6-digit code per paid booking (or set by staff), never sent before payment | `security.test.js`, `invoice.test.js` |
| 10 | Apps Script `doGet` returned all bookings/storage/enquiries; `doPost` was an open, HTML-unescaped email relay; URL public in repo and bundle | Rewritten: shared-secret check, no data over GET, HTML-escaped emails, formula-injection guard, upsert by reference, `LockService`, idempotent emails. Only the server calls it | `outbox.test.js` (secret sent, retries); manual Apps Script deploy |
| 11 | Gemini key compiled into the public bundle (`VITE_GEMINI_API_KEY`) and storable in localStorage | Assistant runs server-side, super admin only, rate-limited; key sent in a header; prompt separates data from the question | `invoice.test.js` assistant test; bundle scan |
| 12 | Mass assignment: `Object.assign(config, req.body)` unauthenticated; anyone could set `payment_status: 'paid'` | zod whitelists on every body; state machine for status/payment changes | `security.test.js` config whitelist; `booking.test.js` state machine |
| 13 | Plain-text passwords stored in localStorage (frontend local "accounts") | Local accounts removed; one-time cleanup deletes old `dd_local_*` keys | Code; bundle scan |
| 14 | Terms acceptance forced `true` server-side; compliance documents never left the browser | Signup and bookings require `terms_accepted: true`; server records time, IP and terms version. Documents uploaded to private GridFS, type-sniffed, owner/admin download only | `security.test.js` signup + documents tests |
| 15 | User-supplied regex in admin search (`new RegExp(q)`) → crash/ReDoS | Input escaped | `security.test.js` |
| 16 | Stack traces returned to clients; 500s on missing fields | Central error handler: no stacks in production, request IDs, 400 validation messages | `security.test.js` |
| 17 | CORS `*`, no security headers, no rate limiting, 10 MB JSON bodies | CORS allowlist, helmet, per-route rate limits (login keyed by IP+email), 100 kB JSON limit | `security.test.js` CORS/headers |
| 18 | Real personal email seeded with password `kitchen123`; demo data seeded on every production start | Seeding is a manual dev-only script with random passwords; `migrate:v2` locks the v1 seed accounts | `scripts/seedDemo.js` refuses `NODE_ENV=production` |

## P0 — Booking integrity

| # | Finding (v1) | Fix | Verified by |
|---|---|---|---|
| 19 | `createBooking` never checked for overlaps, blocked slots, hours or past dates | Slot documents with a unique index claimed in a transaction; blocks claim the same slots; past/advance/hours checks | `booking.test.js`: same slot 409, partial overlaps, blocks both ways, past dates |
| 20 | Race conditions | Unique index makes it impossible regardless of timing (plain transactions alone would allow write skew) | `booking.test.js`: 20 concurrent → exactly 1; 12 overlapping concurrent → no overlaps |
| 21 | Overnight shifts folded into the same day; next morning looked free | UTC `start_at/end_at`, slots span midnight, availability per Perth day from slots | `booking.test.js` overnight test |
| 22 | Pending holds never expired; anyone could fill the calendar unauthenticated | Login required, rate-limited; unpaid holds expire (default 48 h or at start) and free slots | `booking.test.js` hold expiry |
| 23 | Storage auto-confirmed and auto-marked **paid** with no payment; no server capacity check | Pending/unpaid by default; per-bay lock document in a transaction enforces 2-bay capacity | `storage.test.js` capacity + 8 concurrent → 2 |
| 24 | Each booking written to the Sheet twice with two different references (frontend + backend) and two emails | Only the server writes, via the outbox, upserting by reference | `outbox.test.js` |

## P0 — Australian compliance & money

| # | Finding (v1) | Fix | Verified by |
|---|---|---|---|
| 25 | Invoice GST = 10% of the GST-inclusive total ($16.72 instead of $15.20); subtotal + GST ≠ total | Cents arithmetic; ex-GST lines + per-line GST; storage splits 1/11 | `invoice.test.js`, `storage.test.js` |
| 26 | Invoice numbers were array positions — every new booking renumbered all invoices; invoices not persisted | Persisted invoices, counter-based numbers that never change | `invoice.test.js` numbering test |
| 27 | "Mark paid" parsed `INV-2026-BK100` as row 2,026,000 and silently did nothing | Lookup by invoice number; payment updates invoice and booking in one transaction | `invoice.test.js` |
| 28 | Customer ABN fell back to Daily Drop's own ABN | Buyer ABN only if supplied and checksum-valid, else blank | `invoice.test.js` |
| 29 | Issue date = service date | Issue date = Perth date of issue; due date ≤ service start | `invoice.test.js` |
| 30 | Refundable bond mixed into line items and shown twice | Bond separate, excluded from GST, shown once (GST Act s 99-5) | `invoice.test.js`; invoice modal |
| 31 | Three different sets of bank details (NAB/066-000, CBA/066-123, CBA/066-125/1098 7654) and two PayIDs | One set from server config (`PAYMENT_*`), hidden if unset | Code; bundle scan |
| 32 | Four different price tables (UI tiers vs flat $38/h min 4 vs Apps Script vs $45/h fallback); 12 h quoted $396 charged $501.60 | One server price engine from config; UI renders config and server quote | `booking.test.js` pricing |
| 33 | Storage maths counted days inclusively: a 30-day "month" cost $440, a week $140 | Move-out date is exclusive; 30 days = 1 month | `storage.test.js` pricing |
| 34 | Dashboard/AI figures partly fabricated (+$400, bonds "$950", "2 bays occupied", forced "overdue" refs) | Aggregations over real data; risk = transparent rules, labelled as such | `invoice.test.js` dashboard test |

## Timezone (AWST)

| # | Finding (v1) | Fix | Verified by |
|---|---|---|---|
| 35 | `normalizeDate` stored garbage (`'25/12/2026'`, `'banana'`) and read `01/02/2027` as 2 Jan | Strict `YYYY-MM-DD` real-date validation | `booking.test.js` |
| 36 | `formatDisplayDate` showed the next day for browsers in the Americas | Formats in UTC from a UTC noon date | Code (`api.ts`) |
| 37 | *New:* "today", "Tomorrow" and date pickers used `toISOString()` → UTC date, i.e. yesterday in Perth before 8 am | `perthToday()` / `addDaysToDate()` everywhere | Code |
| 38 | *New:* customer "Save to calendar" always exported 21 Oct 2026; ICS times were floating | ICS uses the booking's UTC instants | Code |
| 39 | *New:* admin weekly calendar hard-coded to the week of 26 Oct 2026 | Starts at the current Perth week; bookings placed by absolute overlap (multi-block and overnight) | Code |

## Resilience

| # | Finding (v1) | Fix |
|---|---|---|
| 40 | Silent in-memory DB fallback in production | In-memory only with `USE_IN_MEMORY_DB=true` outside production |
| 41 | No connection retry/backoff or event logging; health always "healthy" | Exponential backoff; connection events logged; `/api/health` returns 503 when DB is down |
| 42 | Sheets webhook awaited in the request with no timeout; failures dropped | Outbox worker, 8 s timeout, exponential backoff, 10 attempts |
| 43 | No `unhandledRejection` / `SIGTERM` handling | Graceful shutdown; fatal errors exit for the process manager to restart |
| 44 | Frontend swallowed every error and fell back to localStorage "success"; read `detail` instead of `error` | Typed client surfaces server messages; 401 clears the session |
| 45 | Error boundary showed raw stacks and its button wiped the only copy of data | Stack only in dev; button just signs out |
| 46 | Lockfile out of sync (`npm ci` failed); CI deployed only the frontend; no tests | Lockfiles regenerated; CI runs backend tests, audit, lint, build and UI smoke tests; Pages deploy requires an API URL |

## Removed fabricated/demo content in the UI

Customer dashboard mock bookings/invoices/recurring slots and a client-side "payment completed" that revealed the door PIN; super-admin fake bond ledger ("bond release initiated to Michael Davies") and fake storage tenants; customer directory fake ABNs; "AI audit synchronized from Google Sheets" messages.

## Round 2 — the remaining gaps

| Gap | What was built |
|---|---|
| Password reset | `POST /auth/forgot-password` (same reply whether or not the account exists, 30-min single-use token stored as a SHA-256 hash) and `POST /auth/reset-password` (signs every other session out). "Forgot password?" in the sign-in modal; the emailed link opens the reset form. |
| Email verification | Verification link emailed on sign-up; `REQUIRE_EMAIL_VERIFICATION=true` blocks booking until verified. Resend from **My Account → Account security**. |
| Admin two-factor | TOTP (Google Authenticator, 1Password, …) with replay protection and AES-256-GCM encrypted secrets. `REQUIRE_ADMIN_2FA=true` forces staff to enrol before anything else. Customers can opt in. |
| Real emails | SMTP (`SMTP_URL`) or the Apps Script webhook; HTML rendered and escaped on the server; delivered through the outbox with retries. |
| Refunds | Full or partial refunds of paid invoices create an ATO-style **adjustment note** (`ADJ-YYYY-NNNNN`) with proportional GST; optional booking cancellation. Shown on the tax invoice and to the customer. |
| Bonds | Settle a storage bond after inspection: refund, partly forfeit or forfeit, with GST on the forfeited part (1/11). Bond status column and "Bonds currently held" total. |
| Bank reconciliation | Upload a bank CSV (CBA/NAB/ANZ/Westpac shapes, day-first dates). Preview matches by booking reference or invoice number, flags wrong amounts and unknown references, then records the matches in one click. |
| Recurring bookings | Weekly/fortnightly series (2–12 sessions) booked for real, each with its own invoice; clashes are skipped and reported. |
| Multi-instance rate limits | MongoDB-backed limiter store (default in production) so limits hold across API instances. |
| Missing UI | Customer directory, kitchen package editor, door code / payment reference fields on approval, storage reject/cancel, refund and bond dialogs, bank import, 2FA setup, account security panel. |
| Bundle & images | Portals lazy-loaded; PNG photos converted/resized to JPEG. Build output 52 MB → 9 MB, main script 441 kB. |
| Deployment | `render.yaml` blueprint (API + website), CI can be run by hand from the Actions tab. |

## Still not done (needs a business decision or an external account)

- **Automatic bank feed / payment provider** (PayTo, Stripe, a bank API). The CSV import covers it manually.
- **Keypad integration**: door codes are generated per booking but must be entered on the keypad by staff unless the keypad vendor has an API.
- Real business details: ABN, legal name, bank account, email sender domain (SPF/DKIM).
- Legal review of Terms & Conditions and a privacy policy.
- Hosting, Atlas, SMTP and monitoring accounts, and running `migrate:v2` once on the real database.
- Splitting the largest components (AdminDashboard, SuperAdminPortal) into smaller files; 37 lint warnings remain (hook dependency style).
