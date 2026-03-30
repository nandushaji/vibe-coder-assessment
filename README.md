# Vibe Coder Assessment

Take-home submission: Next.js mini apps—guest refund form, maintenance logger + dashboard, staff refund review.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Storage), optional Resend for email.

---

## Live URL

**Production:** <https://vibe-coder-assessment.vercel.app/>

---

## App routes

| Feature                  | URL                               | Notes                                       |
| ------------------------ | --------------------------------- | ------------------------------------------- |
| Guest refund request     | `/refunds`                        | Optional evidence upload                    |
| Report maintenance issue | `/maintenance`                    | Optional photo                              |
| Maintenance dashboard    | `/maintenance/dashboard`          | Filters, status updates                     |
| Staff refund review      | `/admin/login` → `/admin/refunds` | Not linked in guest nav; set admin env vars |

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

| Variable                                       | Required        | Purpose                                                                             |
| ---------------------------------------------- | --------------- | ----------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                     | Yes             | Supabase project URL                                                                |
| `SUPABASE_SERVICE_ROLE_KEY`                    | **Recommended** | Server actions, admin refunds, uploads; never expose as `NEXT_PUBLIC_*`             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Alternative     | Use with RLS migrations if service role is omitted (not recommended for production) |
| `ADMIN_USERNAME`                               | For `/admin/*`  | Staff login                                                                         |
| `ADMIN_PASSWORD`                               | For `/admin/*`  | Staff login                                                                         |
| `ADMIN_SESSION_SECRET`                         | For `/admin/*`  | JWT cookie signing (≥ 16 characters)                                                |
| `RESEND_API_KEY`                               | No              | Guest refund confirmation + optional maintenance alerts                             |
| `GUEST_EMAIL_FROM`                             | No              | Resend “from” (verify domain in production)                                         |
| `MAINTENANCE_NOTIFY_EMAIL`                     | No              | Internal email on new maintenance ticket                                            |

Never commit `.env.local`.

---

## Database

- Migrations: `supabase/migrations/`
- Tables: `refunds`, `maintenance_tickets`
- Storage: public buckets `refund-evidence`, `maintenance-photos` (5 MB cap)

| Migration file                                  | Purpose                      |
| ----------------------------------------------- | ---------------------------- |
| `20250330120000_extensions_and_core_tables.sql` | Extensions, core tables      |
| `20250330120100_storage_buckets.sql`            | Storage buckets              |
| `20250330120200_rls_anon_policies.sql`          | RLS for anon/publishable key |
| `20250330120300_refunds_review_status.sql`      | Refund review status column  |

New migration: `npm run migration:new -- name` → edit file → `npm run db:push`

---

## Deploy (Vercel)

1. Create a Vercel project and add the same variables as in `.env.example` (Production environment).
2. Connect your Git repo or deploy with `npx vercel --prod`.
3. After changing env vars, redeploy.

This app uses **Supabase** for persistence only—not a local SQLite file.

### GitHub Actions (CI/CD)

| Workflow            | Trigger                        | What it does                                                                      |
| ------------------- | ------------------------------ | --------------------------------------------------------------------------------- |
| `ci.yml`            | Push & PR to `main` / `master` | `npm run lint`, `npm run build`                                                   |
| `deploy-vercel.yml` | Push to `main` / `master`      | `vercel pull` (production env), `vercel build`, `vercel deploy --prebuilt --prod` |

**Repository secrets** (Settings → Secrets and variables → Actions): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (from [Vercel tokens](https://vercel.com/account/tokens) and Project → Settings → General, or `.vercel/project.json` after `vercel link`).

If the Vercel project **also** has Git auto-deploy enabled, disable one path to avoid duplicate production deploys.

---

## Bonus (beyond brief)

- **Dark mode** — System default + toggle (guest header, admin header, admin login); toasts follow theme.
- **Optional email** — Resend: refund confirmation to guest; optional ops notification for new maintenance tickets when `MAINTENANCE_NOTIFY_EMAIL` is set.
- **Admin refunds** — Search, filters, pagination, CSV export, review statuses.
- **CI/CD** — GitHub Actions as above.

---

## Practical apps

Guest and maintenance flows write to Supabase; staff refund UI requires service role and HTTP-only admin session. See routes and env tables above.

**Scripts:** `npm run dev` · `npm run build` · `npm run lint`
