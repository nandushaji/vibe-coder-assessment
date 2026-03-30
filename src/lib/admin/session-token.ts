import { SignJWT, jwtVerify } from "jose";

export const ADMIN_SESSION_COOKIE = "admin_session";

const JWT_MAX_AGE = "8h";

function getJwtSecret(): Uint8Array {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be set (at least 16 characters). See .env.example."
    );
  }
  return new TextEncoder().encode(s);
}

export async function signAdminSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuedAt()
    .setExpirationTime(JWT_MAX_AGE)
    .sign(getJwtSecret());
}

/** Edge-safe session check for middleware. */
export async function verifyAdminSessionToken(
  token: string
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}
