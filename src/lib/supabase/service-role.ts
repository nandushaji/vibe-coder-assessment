import { createClient } from "@supabase/supabase-js";

/**
 * Server-only client using the service role key. Required for admin operations
 * (e.g. listing refunds) — the publishable key has no SELECT on `refunds`.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "MISSING_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
