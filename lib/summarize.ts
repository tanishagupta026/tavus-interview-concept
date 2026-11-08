// Transcript → structured summary. The sample transcript uses the pre-generated summary.
import { NotWiredUp } from "./config";
import { sampleSummary } from "./sample";
import { verifySummary, type Transcript, type VerifiedSummary } from "./summary";

export async function summarizeTranscript(transcript: Transcript): Promise<VerifiedSummary> {
  if (transcript.source === "fixture") {
    return verifySummary(sampleSummary, transcript);
  }
  // Next: call Claude with structured output matching SummarySchema (no score, no
  // recommendation), parse with SummarySchema, then verifySummary() against the transcript.
  throw new NotWiredUp("The AI summary");
}
