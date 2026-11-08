"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSession } from "@/lib/clientSession";

export function PreBriefCard() {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: code, consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      saveSession({ capSeconds: data.capSeconds, warnSeconds: data.warnSeconds, token: data.token });
      router.push("/session");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={start} className="rounded-2xl border border-line bg-card p-6 sm:p-8">
      <h2 className="font-display text-3xl sm:text-4xl">Before you start</h2>

      <dl className="mt-6 space-y-5">
        <div>
          <dt className="ui text-sm font-medium">What to expect</dt>
          <dd className="mt-1 text-muted">
            About 5 minutes of conversation with an AI interviewer about this role and your work.
          </dd>
        </div>
        <div className="border-l-[3px] border-accent pl-4">
          <dt className="ui text-sm font-medium">You&rsquo;ll be talking to an AI</dt>
          <dd className="mt-1 text-muted">
            The interviewer is an AI. It does not score you or make a decision. A person reviews the summary and the
            full transcript and makes the decision. Nothing about your face, voice, accent, or emotions is analyzed.
          </dd>
        </div>
      </dl>

      <label className="mt-6 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--ink)]"
        />
        <span>I agree to this conversation being recorded and transcribed.</span>
      </label>

      <label className="mt-5 block text-sm font-medium" htmlFor="code">
        Access code
      </label>
      <input
        id="code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoComplete="off"
        spellCheck={false}
        className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-base"
        placeholder="From your invitation"
      />

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!consent || !code.trim() || busy}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Starting…" : "Start the conversation"}
        <span aria-hidden>→</span>
      </button>
    </form>
  );
}
