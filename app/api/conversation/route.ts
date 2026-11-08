import { z } from "zod";
import { config } from "@/lib/config";
import { clientKey, isValidAccessCode, rateLimit } from "@/lib/ratelimit";
import { issueToken } from "@/lib/sessionToken";

const Body = z.object({
  accessCode: z.string().min(1).max(64),
  consent: z.literal(true),
});

// Access gate (M4). The Tavus element creates the conversation in the browser from the
// deployment id, so this route only checks the code and hands back the session limits.
export async function POST(req: Request) {
  const key = clientKey(req);

  // Every attempt counts, so guessing codes is slow too.
  const limited = rateLimit(`conversation:${key}`, 5, 10 * 60_000);
  if (!limited.ok) {
    return Response.json(
      { error: `Too many attempts. Try again in ${limited.retryAfter} seconds.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Please agree to recording and enter your access code." }, { status: 400 });
  }

  if (config.accessCodes.length === 0) {
    return Response.json({ error: "No access codes are configured on the server." }, { status: 503 });
  }
  if (!isValidAccessCode(parsed.data.accessCode, config.accessCodes)) {
    return Response.json({ error: "That access code isn't valid." }, { status: 401 });
  }

  return Response.json({
    capSeconds: config.sessionCapSeconds,
    warnSeconds: config.warnSeconds,
    token: config.sessionSecret ? issueToken(config.sessionSecret) : undefined,
  });
}
