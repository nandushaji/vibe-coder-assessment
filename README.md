# Vibe Coder Assessment

This repository contains the solutions for the Vibe Coder Take-Home Assessment.

## Part A: Written Questions

### Q1 — Architecture & Decision-Making
**Scenario:** A property management company needs an internal tool for expense claims with 12 fields, file uploads, approval routing based on amount ($5K threshold), and searchability.

**Architecture & Tech Stack:**
*   **Framework:** Next.js (App Router) - Provides a unified full-stack environment. React Server Components and Server Actions simplify the data fetching and mutation layer without needing a separate backend.
*   **Database:** PostgreSQL (via Supabase or Vercel Postgres) - Relational data is perfect for structured forms, audit trails, and complex queries.
*   **File Storage:** AWS S3 or Supabase Storage. I would use presigned URLs for uploads: the client requests a secure, temporary upload URL from the server, uploads the file directly to the bucket (saving server bandwidth), and then submits the resulting file URL with the form data.
*   **Approval Routing Logic:** I would implement a state machine pattern in the database (e.g., `status` enum: `PENDING_MANAGER`, `PENDING_DIRECTOR`, `APPROVED`, `REJECTED`). On submission, a server action evaluates the amount:
    *   If `< $5,000`, set status to `PENDING_MANAGER`.
    *   If `>= $5,000`, set status to `PENDING_DIRECTOR`.
    *   Database triggers or application-level webhooks (e.g., using Inngest or custom background jobs) would send email/Slack notifications to the respective approvers.
*   **Searchability:** For basic search, I'd index key columns in PostgreSQL (e.g., `employee_id`, `expense_category`, `status`) and use `ILIKE` or Postgres Full-Text Search for text fields. If the dataset grows massively, I would sync the data to Elasticsearch or Algolia.

### Q2 — Debugging & Problem-Solving
**Scenario:** A web form submitting data to a Google Sheet via an API suddenly fails silently.

**Debugging Steps (in order):**
1.  **Check the Browser Network Tab & Console:** *Why:* To determine if the request is even leaving the client, and if the API is returning a 200 OK or a silent 4xx/5xx error that the frontend isn't handling properly.
2.  **Check Server/API Logs:** *Why:* If the client request succeeds, the failure is happening on the server. Logs (e.g., Vercel Logs, Datadog) will reveal if the Google Sheets API call is throwing an error.
3.  **Verify Google Sheets API Authentication/Credentials:** *Why:* Service account keys or OAuth tokens might have expired, been revoked, or the service account might have been accidentally removed from the Google Sheet's sharing permissions.
4.  **Check Google Sheets API Quotas/Limits:** *Why:* The app might have hit the Google Sheets API rate limit (e.g., 60 requests per minute per user). This often causes silent failures if the API wrapper doesn't throw explicit exceptions.
5.  **Inspect the Target Google Sheet:** *Why:* A user might have renamed the target worksheet tab, deleted columns, added data validation rules, or changed the file's structure, causing the API's append operation to fail or write to an unexpected location.

### Q3 — Integration Thinking
**Scenario:** Connect a CRM, a messaging platform, and a Google Sheet. When a deal is "Closed Won", notify the team and add a row to the sheet.

**Architecture & Tools:**
*   **Tool:** I would use **Make.com** (or n8n) for its visual workflow builder, robust error handling, and built-in integrations for most CRMs, Slack/Teams, and Google Sheets.
*   **Trigger:** A webhook in the CRM triggered specifically on the `deal.stage.changed` event.
*   **Duplicate Prevention (Idempotency):** 
    *   The CRM webhook payload should include a unique `deal_id`.
    *   Before inserting into the Google Sheet, the workflow will perform a "Search Rows" step using the `deal_id`. If a row exists, the workflow halts (preventing duplicates).
    *   Alternatively, use a database (like Redis or a Make.com data store) to cache processed `deal_id`s for 24 hours.
*   **Failure Handling:**
    *   **Retries:** Configure the messaging and sheets modules to automatically retry on 429 (Rate Limit) or 5xx (Server Error) responses with exponential backoff.
    *   **Dead-Letter Queue / Fallback:** If the messaging platform is completely down, the workflow should catch the error and route a fallback notification (e.g., an email to the admin team) containing the payload, ensuring the "Closed Won" event isn't lost.

---

## Part B: Practical Mini Apps

### Supabase (database + file storage)

Data and uploads use **Supabase** (Postgres + Storage). Schema is managed with **versioned migrations** under `supabase/migrations/`.

#### One-time: link the CLI to your project

1. Install dependencies: `npm install`.
2. Log in: `npx supabase login` (opens the browser).
3. Link this repo to your Supabase project (project ref is the subdomain in `https://<ref>.supabase.co`):

   ```bash
   npm run db:link
   ```

4. Push migrations to the remote database:

   ```bash
   npm run db:push
   ```

That applies, in order:

| Migration | Purpose |
|-----------|---------|
| `20250330120000_extensions_and_core_tables.sql` | `pgcrypto`, `refunds`, `maintenance_tickets` |
| `20250330120100_storage_buckets.sql` | Public buckets `refund-evidence` & `maintenance-photos` (5 MB limit) |
| `20250330120200_rls_anon_policies.sql` | RLS policies for **anon** (needed for the publishable key) |

**Service role only:** you can still run `db:push`; migration `20250330120200` is harmless (anon policies do not restrict service role).

#### Local Supabase (optional)

Requires [Docker](https://docs.docker.com/get-docker/). Then:

```bash
npm run db:start    # local Postgres + Studio
npm run db:reset    # replay all migrations (+ optional seeds if enabled)
npm run db:stop
```

Match `[db] major_version` in `supabase/config.toml` to your hosted Postgres major version if you use local stacks heavily.

#### Env

Copy `.env.example` → `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`.

- **Recommended:** `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → *service_role*, server-only).
- **Alternative:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — requires migration `20250330120200` (included in `db:push`).

Never commit `.env.local`. Do not put **service_role** in any `NEXT_PUBLIC_*` variable.

#### New migration

```bash
npm run migration:new -- your_change_name
```

Edit the new file under `supabase/migrations/`, then `npm run db:push`.

**Error `PGRST205`:** migrations were not applied to this project. Run `npm run db:push` (after `db:link`) or paste each file from `supabase/migrations/` into the SQL Editor in timestamp order.

### Setup Instructions

1. Clone the repository.
2. Run `npm install`.
3. Configure Supabase as above.
4. Run `npm run dev` to start the development server.

### Apps Included

*   **Guest Refund Request Form:** `/refunds` (optional evidence file → Supabase Storage `refund-evidence`)
*   **Report maintenance issue:** `/maintenance` (optional photo → `maintenance-photos`)
*   **Issue dashboard:** `/maintenance/dashboard` (table, filters, status updates)
*   **Staff refund review (internal):** `/admin/login` → `/admin/refunds` — **not linked** from the guest header. Requires `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` (see `.env.example`). Uses `SUPABASE_SERVICE_ROLE_KEY` to read the `refunds` table (the publishable key has no SELECT on refunds).

### Deploy notes

On Vercel (or similar), add the same env vars. Use Supabase for persistence; a local `data.sqlite` file is **not** used by this app.
