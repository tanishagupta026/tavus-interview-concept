import { NotWiredUp } from "@/lib/config";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { summarizeTranscript } from "@/lib/summarize";
import { TranscriptSchema } from "@/lib/summary";

// Transcript (captured in the browser from the call) → verified, unscored summary (M6).
export async function POST(req: Request) {
  const limited = rateLimit(`summary:${clientKey(req)}`, 20, 10 * 60_000);
  if (!limited.ok) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = TranscriptSchema.safeParse(body?.transcript);
  if (!parsed.success || parsed.data.utterances.length > 500) {
    return Response.json({ error: "Missing or invalid transcript." }, { status: 400 });
  }

  try {
    return Response.json({ summary: await summarizeTranscript(parsed.data) });
  } catch (err) {
    if (err instanceof NotWiredUp) {
      return Response.json({ error: err.message }, { status: 503 });
    }
    console.error("summary failed", err);
    return Response.json({ error: "Couldn't build the summary." }, { status: 502 });
  }
}
