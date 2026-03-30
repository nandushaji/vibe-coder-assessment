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

### Setup Instructions
1. Clone the repository.
2. Run `npm install`.
3. Run `npm run dev` to start the development server.

### Apps Included
*   **Guest Refund Request Form:** `/refunds`
*   **Maintenance Issue Logger:** `/maintenance`
