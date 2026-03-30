"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { adminLogin } from "@/app/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).includes("NEXT_REDIRECT")
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function AdminLoginForm() {
  const [error, setError] = useState<string | null>(null);

  async function loginAction(formData: FormData) {
    setError(null);
    try {
      const result = await adminLogin(null, formData);
      if (result?.error) setError(result.error);
    } catch (e) {
      if (isNextRedirect(e)) return;
      setError(
        e instanceof Error ? e.message : "Could not sign in. Try again.",
      );
    }
  }

  return (
    <form action={loginAction} className="space-y-4">
      {error ? (
        <p
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="admin-username">Username</Label>
        <Input
          id="admin-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-password">Password</Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
