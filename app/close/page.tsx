"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CandidateReadback, CloseMessage } from "@/components/CandidateReadback";
import { Stepper } from "@/components/Stepper";
import { clearSession, loadSession, updateSession } from "@/lib/clientSession";
import { notifyOwner } from "@/lib/notifyClient";

export default function ClosePage() {
  // sessionStorage is browser-only, so read it after mount.
  const [additions, setAdditions] = useState<string | null>(null);
  useEffect(() => setAdditions(loadSession()?.additions ?? ""), []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Stepper current={2} />
      <p className="mt-12 font-mono text-xs tracking-[0.2em] text-eyebrow uppercase">That&rsquo;s a wrap</p>
      <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight sm:text-7xl">
        Thanks for the conversation.
      </h1>
      <CloseMessage />
      <div className="mt-10">
        {additions !== null && (
          <CandidateReadback initialAdditions={additions} onSaveAdditions={(a) => {
              updateSession({ additions: a });
              notifyOwner("addition");
            }}
          />
        )}
      </div>
      <Link
        href="/"
        onClick={clearSession}
        className="ui mt-8 inline-block text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink"
      >
        Start over
      </Link>
    </div>
  );
}
