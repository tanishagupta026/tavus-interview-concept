import { createHash, timingSafeEqual } from "node:crypto";

// In-memory sliding window. Good enough for a single-instance demo; on serverless each
// instance keeps its own window, so treat it as abuse friction, not a hard guarantee.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  return { ok: true, retryAfter: 0 };
}

export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

function digest(s: string): Buffer {
  return createHash("sha256").update(s).digest();
}

/** Constant-time comparison against each configured code. */
export function isValidAccessCode(code: string, valid: string[]): boolean {
  const d = digest(code.trim());
  let match = false;
  for (const v of valid) {
    if (timingSafeEqual(d, digest(v))) match = true;
  }
  return match;
}
