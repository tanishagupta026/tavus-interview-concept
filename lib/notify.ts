import { config, NotWiredUp } from "./config";
// Server-only: never import from a client component.
import { fmtTime } from "./format";
import type { Transcript } from "./summary";
import { transcriptText } from "./transcriptText";

export type NotifyKind = "ended" | "left_page" | "addition";

type Notice = {
  kind: NotifyKind;
  transcript: Transcript;
  additions: string;
  endReason?: string;
  elapsedSeconds?: number;
};

const REASON: Record<string, string> = {
  ended_by_candidate: "the candidate pressed End",
  ended_by_interviewer: "the interviewer wrapped up",
  time_cap: "the time limit was reached",
};

export function emailConfigured(): boolean {
  return Boolean(config.notifyWebhookUrl && config.notifyWebhookSecret);
}

/**
 * Emails the owner a short note with the transcript attached as a .txt file. The mail is
 * sent from the owner's Gmail by their Apps Script web app (apps-script/Code.gs).
 */
export async function sendTranscriptEmail(n: Notice): Promise<void> {
  if (!emailConfigured()) throw new NotWiredUp("Email notifications");

  const said = n.transcript.utterances.filter((u) => u.speaker === "candidate").length;
  const duration = n.elapsedSeconds != null ? fmtTime(n.elapsedSeconds) : "unknown";
  const subject =
    n.kind === "addition"
      ? "Candidate added a note to their interview"
      : n.kind === "left_page"
        ? `Interview left mid-call (${duration})`
        : `New interview conversation (${duration})`;

  const lead =
    n.kind === "addition"
      ? "The candidate added something after the conversation. The updated transcript is attached."
      : n.kind === "left_page"
        ? "Someone closed or left the page during the call. What was captured is attached."
        : `Someone finished a conversation: ${REASON[n.endReason ?? ""] ?? "it ended"}.`;

  const text = [
    lead,
    "",
    `Length: ${duration}`,
    `Candidate turns: ${said}`,
    `Conversation id: ${n.transcript.conversationId}`,
    `Sent: ${new Date().toUTCString()}`,
    n.additions.trim() ? `\nAdded by the candidate:\n${n.additions.trim()}` : "",
  ].join("\n");

  const file = transcriptText(n.transcript, n.additions);
  // Apps Script answers a POST with a redirect to the result; fetch follows it.
  const res = await fetch(config.notifyWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: config.notifyWebhookSecret,
      subject,
      text,
      filename: `transcript-${n.transcript.conversationId}.txt`,
      attachment: file,
    }),
  });
  const reply = await res.text();
  // The script always returns 200, so read its JSON for the real outcome.
  let ok = false;
  try {
    ok = res.ok && (JSON.parse(reply) as { ok?: boolean }).ok === true;
  } catch {
    // not JSON: usually a Google sign-in page, meaning the deployment isn't public
  }
  if (!ok) throw new Error(`Apps Script didn't send (${res.status}): ${reply.slice(0, 300)}`);
}
