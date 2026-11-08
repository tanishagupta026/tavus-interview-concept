// Illustrative criteria from the PRD. Shared by the UI and the summary schema.
export const CRITERION_IDS = [
  "structured_thinking",
  "honesty_limits",
  "ownership_evidence",
  "skeptical_stakeholders",
] as const;

export type CriterionId = (typeof CRITERION_IDS)[number];

export const CRITERIA: { id: CriterionId; name: string; blurb: string }[] = [
  {
    id: "structured_thinking",
    name: "Structured thinking under ambiguity",
    blurb: "How you break down a problem when the facts are incomplete.",
  },
  {
    id: "honesty_limits",
    name: "Honesty about limits and trade-offs",
    blurb: "Saying what you don't know and what a choice costs.",
  },
  {
    id: "ownership_evidence",
    name: "Ownership with evidence",
    blurb: "What you did yourself, backed by specifics.",
  },
  {
    id: "skeptical_stakeholders",
    name: "Communicating with skeptical stakeholders",
    blurb: "Answering pushback with substance, not confidence.",
  },
];
