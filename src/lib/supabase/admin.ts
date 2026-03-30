import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client. Import only from server actions / RSC.
 *
 * Prefers `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS). If unset, falls back to
 * the publishable/anon key — you must then run `supabase/rls-and-storage-policies.sql`.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const key = serviceKey ?? publishableKey;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY. See .env.example."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
