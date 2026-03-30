"use client";

import { Card, CardContent } from "@/components/ui/card";

export function RefundsLoadError({
  errorMessage,
  missingServiceRole,
}: {
  errorMessage: string;
  missingServiceRole: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl px-3 py-10 sm:px-6 sm:py-12">
      <Card className="rounded-2xl border-destructive/40">
        <CardContent className="space-y-4 p-6 text-sm">
          <p className="font-medium text-destructive">Cannot load refunds</p>
          {!missingServiceRole ? (
            <p className="text-muted-foreground">{errorMessage}</p>
          ) : null}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="font-medium text-foreground">
              Add the service role key (server-only)
            </p>
            <p className="mt-2 text-muted-foreground">
              Guest forms use the <strong>publishable</strong> key, which cannot
              read <code className="rounded bg-muted px-1 text-xs">refunds</code>
              . Staff review uses a separate secret that bypasses RLS.
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted-foreground">
              <li>
                Open{" "}
                <a
                  href="https://supabase.com/dashboard/project/_/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Supabase → Project Settings → API
                </a>
                .
              </li>
              <li>
                Under <strong>Project API keys</strong>, copy the{" "}
                <strong>service_role</strong> value (long JWT, labeled secret —
                not <em>publishable</em> or <em>anon</em>).
              </li>
              <li>
                In <code className="rounded bg-muted px-1 text-xs">.env.local</code>{" "}
                set{" "}
                <code className="rounded bg-muted px-1 text-xs">
                  SUPABASE_SERVICE_ROLE_KEY
                </code>
                .
              </li>
              <li>Restart <code className="text-xs">npm run dev</code> and reload.</li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">
            On Vercel, add the same variable in Environment Variables (never{" "}
            <code className="text-xs">NEXT_PUBLIC_*</code>).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
