import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// A signed ticket handed out when the access code checks out. The notify route only
// emails transcripts that carry one, so the endpoint can't be used to spam the inbox
// by anyone who hasn't passed the access gate.
const MAX_AGE_MS = 2 * 60 * 60_000;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function issueToken(secret: string, now = Date.now()): string {
  const payload = `${now}.${randomBytes(9).toString("base64url")}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** Returns the token's id (stable per session) when valid, otherwise null. */
export function verifyToken(token: string, secret: string, now = Date.now()): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [issued, nonce, sig] = parts;
  const expected = Buffer.from(sign(`${issued}.${nonce}`, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const age = now - Number(issued);
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_MS) return null;
  return nonce;
}
