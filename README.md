# Vibe Coder Assessment

Take-home submission: **Part A** (written) and **Part B** (Next.js mini apps—guest refund form, maintenance logger + dashboard, staff refund review).

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Storage), optional Resend for email.

---

## Live URL

**Production:** <https://example.vercel.app> — replace with your real deployment URL (Vercel **Domains** or GitHub Actions deploy output).

---

## App routes

| Feature | URL | Notes |
|--------|-----|--------|
| Guest refund request | `/refunds` | Optional evidence upload |
| Report maintenance issue | `/maintenance` | Optional photo |
| Maintenance dashboard | `/maintenance/dashboard` | Filters, status updates |
| Staff refund review | `/admin/login` → `/admin/refunds` | Not linked in guest nav; set admin env vars |

---

## Run locally

1. Clone the repo and install: `npm install`
2. Copy `.env.example` to `.env.local` and fill values (see [Environment variables](#environment-variables))
3. **First-time database:** link Supabase and apply migrations:
   ```bash
   npx supabase login
   npm run db:link
   npm run db:push
   ```
4. Start the app: `npm run dev` → [http://localhost:3000](http://localhost:3000)

If you see Supabase error **`PGRST205`**, migrations are missing on the remote project—run `db:push` or execute `supabase/migrations/*.sql` in the Supabase SQL editor in timestamp order.

**Optional local Supabase** (Docker): `npm run db:start` · `npm run db:reset` · `npm run db:stop`

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Recommended** | Server actions, admin refunds, uploads; never expose as `NEXT_PUBLIC_*` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Alternative | Use with RLS migrations if service role is omitted (not recommended for production) |
| `ADMIN_USERNAME` | For `/admin/*` | Staff login |
| `ADMIN_PASSWORD` | For `/admin/*` | Staff login |
| `ADMIN_SESSION_SECRET` | For `/admin/*` | JWT cookie signing (≥ 16 characters) |
| `RESEND_API_KEY` | No | Guest refund confirmation + optional maintenance alerts |
| `GUEST_EMAIL_FROM` | No | Resend “from” (verify domain in production) |
| `MAINTENANCE_NOTIFY_EMAIL` | No | Internal email on new maintenance ticket |

Never commit `.env.local`.

---

## Database

- Migrations: `supabase/migrations/`
- Tables: `refunds`, `maintenance_tickets`
- Storage: public buckets `refund-evidence`, `maintenance-photos` (5 MB cap)

| Migration file | Purpose |
|----------------|---------|
| `20250330120000_extensions_and_core_tables.sql` | Extensions, core tables |
| `20250330120100_storage_buckets.sql` | Storage buckets |
| `20250330120200_rls_anon_policies.sql` | RLS for anon/publishable key |
| `20250330120300_refunds_review_status.sql` | Refund review status column |

New migration: `npm run migration:new -- name` → edit file → `npm run db:push`

---

## Deploy (Vercel)

1. Create a Vercel project and add the same variables as in `.env.example` (Production environment).
2. Connect your Git repo or deploy with `npx vercel --prod`.
3. After changing env vars, redeploy.

This app uses **Supabase** for persistence only—not a local SQLite file.

### GitHub Actions (CI/CD)

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | Push & PR to `main` / `master` | `npm run lint`, `npm run build` |
| `deploy-vercel.yml` | Push to `main` / `master` | `vercel pull` (production env), `vercel build`, `vercel deploy --prebuilt --prod` |

**Repository secrets** (Settings → Secrets and variables → Actions): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (from [Vercel tokens](https://vercel.com/account/tokens) and Project → Settings → General, or `.vercel/project.json` after `vercel link`).

If the Vercel project **also** has Git auto-deploy enabled, disable one path to avoid duplicate production deploys.

---

## Bonus (beyond brief)

- **Dark mode** — System default + toggle (guest header, admin header, admin login); toasts follow theme.
- **Optional email** — Resend: refund confirmation to guest; optional ops notification for new maintenance tickets when `MAINTENANCE_NOTIFY_EMAIL` is set.
- **Admin refunds** — Search, filters, pagination, CSV export, review statuses.
- **CI/CD** — GitHub Actions as above.

---

## Part A — Written questions

### Q1 — Architecture & decision-making

**Scenario:** Internal expense claims (12 fields, file uploads). Routing: &lt; $5K → department manager; ≥ $5K → finance director + CEO. All submissions stored and searchable by finance.

**Approach:**

- **Stack:** Next.js (App Router) for a single full-stack surface; PostgreSQL (e.g. Supabase) for structured data, audit-friendly models, and queries.
- **Files:** Object storage (S3 or Supabase Storage) with **presigned uploads** from the client, then persist object URLs with the claim.
- **Routing:** DB-backed workflow (e.g. status: `PENDING_MANAGER`, `PENDING_DIRECTOR`, `APPROVED`, `REJECTED`). On submit, server evaluates amount and sets the next state; notify approvers (email/Slack/job queue).
- **Search:** Indexed columns in Postgres; `ILIKE` or full-text search for text fields; scale-out options (e.g. Elasticsearch) only if needed later.

### Q2 — Debugging (Google Sheet API, silent failure)

1. **Browser Network + Console** — Confirm the request fires and whether the API returns an error the UI ignores.
2. **Server logs** — See if the Sheets call fails server-side after a “successful” client response.
3. **Auth** — Service account / OAuth expiry, revocation, or sheet sharing changes.
4. **Quotas** — Sheets API rate limits causing failures without clear UI errors.
5. **Sheet structure** — Renamed tabs, moved columns, or validation blocking writes.

### Q3 — Integration (CRM + messaging + Google Sheet on “Closed Won”)

- **Tools:** e.g. **Make.com** or **n8n** for CRM webhooks → Slack/Teams → Sheets.
- **Trigger:** CRM webhook on stage change (e.g. closed won).
- **Idempotency:** Stable `deal_id` in payload; search sheet (or small store) before insert to prevent duplicates from double webhook delivery.
- **Failures:** Retries with backoff on 429/5xx; fallback channel (e.g. email to admin) if messaging is down; log payloads for replay.

---

## Part B — Practical apps

Guest and maintenance flows write to Supabase; staff refund UI requires service role and HTTP-only admin session. See routes and env tables above.

**Scripts:** `npm run dev` · `npm run build` · `npm run lint`
