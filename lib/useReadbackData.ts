"use client";

import { useEffect, useState } from "react";
import { loadSession } from "./clientSession";
import { verifiedSample } from "./sample";
import type { Transcript, VerifiedSummary } from "./summary";

export type ReadbackData =
  | { kind: "loading" }
  | {
      kind: "ready";
      transcript: Transcript;
      /** null when the conversation ran but no AI summary could be built for it. */
      summary: VerifiedSummary | null;
      summaryNote?: string;
      additions: string;
      sampleNotice?: string;
    };

function sample(reason: string, additions = ""): ReadbackData {
  return { kind: "ready", ...verifiedSample(), additions, sampleNotice: reason };
}

/**
 * Loads the transcript captured from the call in this browser tab and its verified summary.
 * Falls back to the pre-generated sample (M8) when no conversation was captured.
 */
export function useReadbackData(): ReadbackData {
  const [state, setState] = useState<ReadbackData>({ kind: "loading" });

  useEffect(() => {
    const session = loadSession();
    const additions = session?.additions ?? "";
    if (!session?.endedAt) {
      setState(sample("No conversation ran in this browser, so this is a pre-generated example."));
      return;
    }
    if (!session.utterances?.length) {
      setState(sample("Nothing was said in the conversation, so this is a pre-generated example.", additions));
      return;
    }
    const transcript: Transcript = {
      conversationId: session.conversationId ?? "unknown",
      source: "live",
      utterances: session.utterances,
    };
    let cancelled = false;
    (async () => {
      let summary: VerifiedSummary | null = null;
      let summaryNote: string | undefined;
      try {
        const res = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Summary unavailable");
        summary = data.summary;
      } catch (err) {
        summaryNote = err instanceof Error ? err.message : "The summary couldn't be built.";
      }
      if (!cancelled) setState({ kind: "ready", transcript, summary, summaryNote, additions });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
