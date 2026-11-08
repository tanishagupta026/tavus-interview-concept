import { fmtTime } from "./format";
import type { Transcript } from "./summary";

/** Plain-text transcript, used for the download button and the email attachment. */
export function transcriptText(transcript: Transcript, additions: string): string {
  const lines = [
    "Tenex AI Interview Concept - conversation transcript",
    `Conversation: ${transcript.conversationId}${transcript.source === "fixture" ? " (sample)" : ""}`,
    "Not affiliated with any employer. No score or recommendation was produced.",
    "",
    ...transcript.utterances.map(
      (u) => `[${fmtTime(u.t)}] ${u.speaker === "interviewer" ? "Interviewer (AI)" : "Candidate"}: ${u.text}`,
    ),
  ];
  if (transcript.utterances.length === 0) lines.push("(Nothing was said.)");
  if (additions.trim()) {
    lines.push("", "Added by the candidate after the conversation:", additions.trim());
  }
  return lines.join("\n") + "\n";
}
