"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { secretEquals } from "@/lib/admin/credentials";
import {
  ADMIN_SESSION_COOKIE,
  signAdminSessionToken,
} from "@/lib/admin/session-token";

export async function adminLogin(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return {
      error:
        "Admin sign-in is not configured (missing ADMIN_USERNAME or ADMIN_PASSWORD).",
    };
  }

  try {
    if (!secretEquals(username, expectedUser) || !secretEquals(password, expectedPass)) {
      return { error: "Invalid username or password." };
    }

    const token = await signAdminSessionToken();
    const jar = await cookies();
    jar.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/admin",
      maxAge: 60 * 60 * 8,
    });
  } catch (e) {
    console.error("adminLogin:", e);
    return {
      error:
        e instanceof Error
          ? e.message
          : "Could not complete sign-in. Check server configuration.",
    };
  }

  redirect("/admin/refunds");
}

export async function adminLogout() {
  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, "", {
    path: "/admin",
    maxAge: 0,
  });
  redirect("/admin/login");
}
