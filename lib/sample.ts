// Pre-generated sample data (M7 mock mode, M8 fallback). Pure, so it runs on server or client.
import summaryJson from "@/fixtures/sample-summary.json";
import transcriptJson from "@/fixtures/sample-transcript.json";
import { SummarySchema, TranscriptSchema, verifySummary } from "./summary";

export const sampleTranscript = TranscriptSchema.parse(transcriptJson);
export const sampleSummary = SummarySchema.parse(summaryJson);

export function verifiedSample() {
  return { transcript: sampleTranscript, summary: verifySummary(sampleSummary, sampleTranscript) };
}
