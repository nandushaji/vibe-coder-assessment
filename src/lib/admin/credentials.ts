import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time compare of UTF-8 strings via SHA-256 digests (Node server only). */
export function secretEquals(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a, "utf8").digest();
  const bh = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ah, bh);
}
