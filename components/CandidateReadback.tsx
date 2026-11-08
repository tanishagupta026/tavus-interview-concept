"use client";

import { useState } from "react";

export function CloseMessage() {
  return (
    <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted">
      A person on the hiring team will read your full transcript and make the decision. The AI doesn&rsquo;t score you.
      You&rsquo;ll hear from them directly, and you can ask for your recording and transcript to be deleted at any
      time.
    </p>
  );
}

type Props = {
  initialAdditions?: string;
  onSaveAdditions?: (text: string) => void;
};

// Candidate-facing only. The recruiter summary lives on /recruiter and is never rendered here.
export function CandidateReadback({ initialAdditions = "", onSaveAdditions }: Props) {
  const [draft, setDraft] = useState(initialAdditions);
  const [saved, setSaved] = useState(initialAdditions);

  function save() {
    setSaved(draft);
    onSaveAdditions?.(draft);
  }

  return (
    <section className="rounded-2xl border border-line bg-card p-6 sm:p-8" aria-labelledby="additions-heading">
      <h2 id="additions-heading" className="font-display text-3xl">
        Add something I missed
      </h2>
      <p className="mt-2 text-sm text-muted">The reviewer sees this alongside your transcript, marked as added afterwards.</p>
      <textarea
        id="additions"
        aria-labelledby="additions-heading"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        maxLength={1500}
        className="mt-4 w-full rounded-lg border border-line bg-paper px-3 py-2"
        placeholder="For example: the invoice project was mine end to end; I built the baseline myself."
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={draft === saved}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink hover:brightness-95 disabled:opacity-40"
        >
          Add to my transcript <span aria-hidden>→</span>
        </button>
        {saved && draft === saved && <span className="text-sm text-muted">Added.</span>}
      </div>
    </section>
  );
}
