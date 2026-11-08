import { describe, expect, it } from "vitest";
import { isValidAccessCode, rateLimit } from "./ratelimit";
import { sampleSummary, sampleTranscript, verifiedSample } from "./sample";
import { NOT_ENOUGH_EVIDENCE, SummarySchema, verifySummary, type Summary } from "./summary";

describe("sample fixtures", () => {
  it("every sample quote matches the transcript word for word", () => {
    const { summary } = verifiedSample();
    expect(summary.meta.quotesRemoved).toBe(0);
    expect(summary.meta.quotesChecked).toBeGreaterThan(0);
    expect(summary.criteria.every((c) => c.status === "evidence")).toBe(true);
  });
});

describe("verifySummary", () => {
  const withEvidence = (evidence: Summary["criteria"][number]["evidence"]): Summary => ({
    ...sampleSummary,
    criteria: sampleSummary.criteria.map((c) => (c.id === "honesty_limits" ? { ...c, evidence } : c)),
  });

  it("removes a fabricated quote and flags it", () => {
    const out = verifySummary(
      withEvidence([{ quote: "I single-handedly saved the company ten million dollars.", t: 84 }]),
      sampleTranscript,
    );
    const c = out.criteria.find((x) => x.id === "honesty_limits")!;
    expect(c.evidence).toHaveLength(0);
    expect(c.status).toBe("not_enough_evidence");
    expect(c.observation).toBe(NOT_ENOUGH_EVIDENCE);
    expect(out.meta.quotesRemoved).toBe(1);
    expect(out.uncertainties.at(-1)).toMatch(/could not be matched/);
  });

  it("rejects a real quote with the wrong timestamp", () => {
    const out = verifySummary(
      withEvidence([{ quote: "I can't give you a credible number without your data", t: 190 }]),
      sampleTranscript,
    );
    expect(out.meta.quotesRemoved).toBe(1);
  });

  it("does not accept the interviewer's words as candidate evidence", () => {
    const out = verifySummary(withEvidence([{ quote: "Why should I spend another dollar?", t: 28 }]), sampleTranscript);
    expect(out.meta.quotesRemoved).toBe(1);
  });

  it("reports a missing criterion as not enough evidence", () => {
    const out = verifySummary({ ...sampleSummary, criteria: [] }, sampleTranscript);
    expect(out.criteria).toHaveLength(4);
    expect(out.criteria.every((c) => c.status === "not_enough_evidence")).toBe(true);
  });
});

describe("SummarySchema", () => {
  it("rejects a score or recommendation field", () => {
    expect(SummarySchema.safeParse({ ...sampleSummary, score: 4 }).success).toBe(false);
    const criteria = [{ ...sampleSummary.criteria[0], rating: "strong" }];
    expect(SummarySchema.safeParse({ ...sampleSummary, criteria }).success).toBe(false);
  });
});

describe("access gate", () => {
  it("checks access codes", () => {
    expect(isValidAccessCode("demo-2026", ["demo-2026"])).toBe(true);
    expect(isValidAccessCode(" demo-2026 ", ["demo-2026"])).toBe(true);
    expect(isValidAccessCode("guess", ["demo-2026"])).toBe(false);
    expect(isValidAccessCode("demo-2026", [])).toBe(false);
  });

  it("rate-limits after the limit", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
});
