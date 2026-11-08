import { z } from "zod";
import { CRITERIA, CRITERION_IDS } from "./criteria";

export const UtteranceSchema = z.object({
  t: z.number().nonnegative(),
  speaker: z.enum(["interviewer", "candidate"]),
  text: z.string(),
});

export const TranscriptSchema = z.object({
  conversationId: z.string(),
  source: z.enum(["fixture", "live"]),
  utterances: z.array(UtteranceSchema),
});

export const EvidenceSchema = z.object({
  quote: z.string().min(1),
  t: z.number().nonnegative(),
});

// .strict() everywhere: a score, rating, or recommendation field is a schema error, not a hidden extra.
export const CriterionSummarySchema = z
  .object({
    id: z.enum(CRITERION_IDS),
    observation: z.string(),
    evidence: z.array(EvidenceSchema),
    gaps: z.array(z.string()),
  })
  .strict();

export const SummarySchema = z
  .object({
    criteria: z.array(CriterionSummarySchema),
    uncertainties: z.array(z.string()),
    readback: z.array(z.string()),
  })
  .strict();

export type Utterance = z.infer<typeof UtteranceSchema>;
export type Transcript = z.infer<typeof TranscriptSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Summary = z.infer<typeof SummarySchema>;

export type VerifiedCriterion = z.infer<typeof CriterionSummarySchema> & {
  status: "evidence" | "not_enough_evidence";
};

export type VerifiedSummary = {
  criteria: VerifiedCriterion[];
  uncertainties: string[];
  readback: string[];
  meta: { quotesChecked: number; quotesRemoved: number };
};

export const NOT_ENOUGH_EVIDENCE = "Not enough evidence in this conversation.";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the quote appears word for word in a candidate utterance starting at (about) time t. */
export function quoteMatches(e: Evidence, transcript: Transcript): boolean {
  const q = normalize(e.quote);
  if (!q) return false;
  return transcript.utterances.some(
    (u) => u.speaker === "candidate" && Math.abs(u.t - e.t) < 1 && normalize(u.text).includes(q),
  );
}

/**
 * Every claim must carry a verbatim quote and timestamp (PRD section 9). Evidence that does
 * not match the transcript is removed and flagged; a criterion left with no evidence is
 * reported as "not enough evidence" rather than guessed at.
 */
export function verifySummary(summary: Summary, transcript: Transcript): VerifiedSummary {
  let quotesChecked = 0;
  let quotesRemoved = 0;

  const criteria: VerifiedCriterion[] = CRITERIA.map((c) => {
    const s = summary.criteria.find((x) => x.id === c.id);
    if (!s) {
      return { id: c.id, observation: NOT_ENOUGH_EVIDENCE, evidence: [], gaps: [], status: "not_enough_evidence" };
    }
    const evidence = s.evidence.filter((e) => {
      quotesChecked++;
      const ok = quoteMatches(e, transcript);
      if (!ok) quotesRemoved++;
      return ok;
    });
    if (evidence.length === 0) {
      return { ...s, observation: NOT_ENOUGH_EVIDENCE, evidence, status: "not_enough_evidence" };
    }
    return { ...s, evidence, status: "evidence" };
  });

  const uncertainties = [...summary.uncertainties];
  if (quotesRemoved > 0) {
    uncertainties.push(
      `${quotesRemoved} quote${quotesRemoved === 1 ? "" : "s"} could not be matched word for word to the transcript and ${quotesRemoved === 1 ? "was" : "were"} removed.`,
    );
  }

  return { criteria, uncertainties, readback: summary.readback, meta: { quotesChecked, quotesRemoved } };
}
