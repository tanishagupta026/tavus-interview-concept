"use client";

import { CRITERIA } from "@/lib/criteria";
import { fmtTime } from "@/lib/format";
import type { Transcript, VerifiedSummary } from "@/lib/summary";
import { transcriptText } from "@/lib/transcriptText";

type Props = {
  transcript: Transcript;
  summary: VerifiedSummary | null;
  /** Why there is no summary, when summary is null. */
  summaryNote?: string;
  additions: string;
};

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const nameOf = (id: string) => CRITERIA.find((c) => c.id === id)?.name ?? id;

export function RecruiterSummary({ transcript, summary, summaryNote, additions }: Props) {
  return (
    <section className="rounded-2xl border border-line bg-card p-6 sm:p-8" aria-labelledby="recruiter">
      <h2 id="recruiter" className="font-display text-3xl">
        Summary
      </h2>
      {summary ? (
        <p className="mt-2 text-sm text-muted">
          No score and no recommendation. Every claim links to a verbatim quote.{" "}
          {summary.meta.quotesChecked - summary.meta.quotesRemoved} of {summary.meta.quotesChecked} quotes matched the
          transcript word for word.
        </p>
      ) : (
        <p className="mt-2 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
          No AI summary for this conversation. {summaryNote} Read the full transcript below.
        </p>
      )}

      <div className="mt-6 space-y-5">
        {summary?.criteria.map((c) => (
          <article key={c.id} className="rounded-xl border border-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-medium">{nameOf(c.id)}</h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs ${
                  c.status === "evidence" ? "ui bg-accent-soft text-ink" : "bg-warn-soft text-warn"
                }`}
              >
                {c.status === "evidence" ? `${c.evidence.length} quoted` : "Not enough evidence"}
              </span>
            </div>
            <p className="mt-2 text-sm">{c.observation}</p>
            {c.evidence.length > 0 && (
              <ul className="mt-3 space-y-2">
                {c.evidence.map((e) => (
                  <li key={`${e.t}-${e.quote}`} className="flex gap-3 text-sm">
                    <span className="shrink-0 rounded bg-paper px-1.5 py-0.5 font-mono text-xs text-muted tabular-nums">
                      {fmtTime(e.t)}
                    </span>
                    <q className="italic">{e.quote}</q>
                  </li>
                ))}
              </ul>
            )}
            {c.gaps.length > 0 && (
              <div className="mt-3 text-sm">
                <p className="font-medium text-warn">Gaps</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
                  {c.gaps.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>

      {summary && summary.uncertainties.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium">Uncertainties</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {summary.uncertainties.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-dashed border-line p-4 text-sm">
        <p className="font-medium">Added by the candidate after the conversation</p>
        <p className="mt-1 whitespace-pre-wrap text-muted">{additions.trim() || "Nothing added."}</p>
      </div>

      <details className="mt-6 text-sm" open={!summary}>
        <summary className="cursor-pointer font-medium">Full transcript</summary>
        <ol className="mt-3 space-y-2">
          {transcript.utterances.map((u, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 font-mono text-xs text-muted tabular-nums">{fmtTime(u.t)}</span>
              <span>
                <span className="font-medium">{u.speaker === "interviewer" ? "Interviewer (AI)" : "Candidate"}:</span>{" "}
                {u.text}
              </span>
            </li>
          ))}
        </ol>
      </details>

      <button
        onClick={() => download(`transcript-${transcript.conversationId}.txt`, transcriptText(transcript, additions))}
        className="mt-6 rounded-full border border-ink px-4 py-2 text-sm font-medium hover:bg-ink hover:text-paper"
      >
        Download transcript
      </button>
    </section>
  );
}
