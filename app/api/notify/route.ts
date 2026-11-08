import { z } from "zod";
import { config } from "@/lib/config";
import { emailConfigured, sendTranscriptEmail } from "@/lib/notify";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { verifyToken } from "@/lib/sessionToken";
import { TranscriptSchema, UtteranceSchema } from "@/lib/summary";

const Body = z.object({
  token: z.string().min(1).max(200),
  kind: z.enum(["ended", "left_page", "addition"]),
  transcript: TranscriptSchema.extend({
    conversationId: z.string().max(100),
    utterances: z.array(UtteranceSchema.extend({ text: z.string().max(4000) })).max(500),
  }),
  additions: z.string().max(1500).default(""),
  endReason: z.string().max(40).optional(),
  elapsedSeconds: z.number().nonnegative().max(24 * 3600).optional(),
});

// Emails the owner when a conversation ends (and when the candidate adds a note).
// Only sessions that passed the access gate carry a valid token.
export async function POST(req: Request) {
  if (!emailConfigured() || !config.sessionSecret) {
    return Response.json({ error: "Email notifications are off." }, { status: 503 });
  }

  // sendBeacon posts text/plain, so parse the body by hand.
  const raw = await req.text().catch(() => "");
  let json: unknown = null;
  try {
    json = JSON.parse(raw);
  } catch {
    // falls through to the schema error
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Bad request." }, { status: 400 });

  const id = verifyToken(parsed.data.token, config.sessionSecret);
  if (!id) return Response.json({ error: "Session expired." }, { status: 401 });

  // A session sends one end email plus a few note updates; an IP gets a handful an hour.
  const perSession = rateLimit(`notify:${id}`, 4, 2 * 60 * 60_000);
  const perIp = rateLimit(`notify-ip:${clientKey(req)}`, 12, 60 * 60_000);
  if (!perSession.ok || !perIp.ok) return Response.json({ error: "Too many emails." }, { status: 429 });

  try {
    await sendTranscriptEmail(parsed.data);
  } catch (e) {
    console.error("notify failed", e);
    return Response.json({ error: "Couldn't send the email." }, { status: 502 });
  }
  return new Response(null, { status: 204 });
}
