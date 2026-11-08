"use client";

import Link from "next/link";
import { RecruiterSummary } from "@/components/RecruiterSummary";
import { SampleNotice } from "@/components/SampleNotice";
import { useReadbackData } from "@/lib/useReadbackData";

// Recruiter mode: the reviewer's view. Not linked from any candidate screen.
// In a real deployment this would sit behind reviewer sign-in.
export default function RecruiterPage() {
  const state = useReadbackData();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/close"
        className="inline-block rounded-full border border-ink px-3 py-1 text-sm font-medium whitespace-nowrap hover:bg-ink hover:text-paper"
      >
        ← Back to next steps
      </Link>
      <p className="mt-10 font-mono text-xs tracking-[0.2em] text-eyebrow uppercase">Recruiter mode</p>
      <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl">
        Candidate conversation review
      </h1>
      <p className="mt-3 text-muted">
        Read the summary and the transcript, then decide. The AI does not score or recommend.
      </p>
      <div className="mt-6 space-y-6">
        {state.kind === "loading" ? (
          <p className="text-muted">Loading the summary…</p>
        ) : (
          <>
            {state.sampleNotice && <SampleNotice>{state.sampleNotice}</SampleNotice>}
            <RecruiterSummary
              transcript={state.transcript}
              summary={state.summary}
              summaryNote={state.summaryNote}
              additions={state.additions}
            />
          </>
        )}
      </div>
    </div>
  );
}
