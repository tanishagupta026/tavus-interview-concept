"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Stepper } from "@/components/Stepper";
import type { InterviewerController } from "@/components/TavusInterviewer";
import { loadSession, updateSession, type EndReason, type StoredSession } from "@/lib/clientSession";
import { fmtTime } from "@/lib/format";
import { notifyOwner } from "@/lib/notifyClient";
import type { Utterance } from "@/lib/summary";
import { END_INTERVIEW_TOOL } from "@/lib/tavusDeployment";

// <tavus-embed> is browser-only, so the component that registers it never renders on the server.
const TavusInterviewer = dynamic(() => import("@/components/TavusInterviewer"), {
  ssr: false,
  loading: () => <p className="flex h-full items-center justify-center text-sm text-white/70">Loading the interviewer…</p>,
});

const AGENDA = [
  "Total 5 mins of conversation",
  "The interviewer explains the format",
  "One question about your work",
];

export default function SessionPage() {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null | undefined>(undefined);
  const [now, setNow] = useState(() => Date.now());
  const [problem, setProblem] = useState<string | null>(null);
  const controller = useRef<InterviewerController | null>(null);
  const endedRef = useRef(false);
  const warnedRef = useRef(false);
  const utterances = useRef<Utterance[]>([]);

  useEffect(() => {
    const s = loadSession();
    if (!s || s.endedAt) {
      router.replace(s?.endedAt ? "/close" : "/");
      setSession(null);
      return;
    }
    utterances.current = s.utterances ?? [];
    setSession(s);
  }, [router]);

  useEffect(() => {
    if (!session?.startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [session?.startedAt]);

  const startedAt = session?.startedAt;
  const elapsed = startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;

  const finish = useCallback(
    (reason: EndReason) => {
      if (endedRef.current) return;
      endedRef.current = true;
      controller.current?.end();
      const s = loadSession();
      const secs = s?.startedAt ? (Date.now() - s.startedAt) / 1000 : 0;
      const ended = updateSession({ endedAt: Date.now(), elapsedSeconds: Math.round(secs), endReason: reason });
      if (ended && !ended.notified) {
        updateSession({ notified: true });
        notifyOwner("ended");
      }
      router.push("/close");
    },
    [router],
  );

  const onStarted = useCallback((conversationId: string) => {
    setProblem(null);
    const s = loadSession();
    // Keep the first start time, so a reload and rejoin can't reset the cap.
    const next = updateSession({ conversationId, startedAt: s?.startedAt ?? Date.now() });
    if (next) setSession(next);
  }, []);

  const onUtterance = useCallback((speaker: Utterance["speaker"], text: string) => {
    const s = loadSession();
    const t = s?.startedAt ? Math.round(((Date.now() - s.startedAt) / 1000) * 10) / 10 : 0;
    utterances.current = [...utterances.current, { t, speaker, text }];
    updateSession({ utterances: utterances.current });
  }, []);

  // Closing the tab mid-call still sends what was captured. A reload also fires this,
  // so it doesn't mark the session notified: the normal end email still goes out.
  useEffect(() => {
    const onHide = () => {
      if (!endedRef.current && loadSession()?.startedAt) notifyOwner("left_page");
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  // Hard cap (M3) and the one-minute nudge, both counted from when the call connected.
  useEffect(() => {
    if (!session?.startedAt) return;
    if (elapsed >= session.capSeconds) {
      finish("time_cap");
    } else if (!warnedRef.current && session.capSeconds - elapsed <= session.warnSeconds) {
      warnedRef.current = true;
      controller.current?.addContext(
        `About one minute remains. Begin the closing read-back now, then say goodbye and call ${END_INTERVIEW_TOOL}.`,
      );
    }
  }, [elapsed, session, finish]);

  if (!session) {
    return <div className="mx-auto max-w-6xl px-4 py-12 text-muted sm:px-6">Loading…</div>;
  }

  const remaining = session.capSeconds - elapsed;
  const warning = Boolean(startedAt) && remaining <= session.warnSeconds;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Stepper current={1} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section aria-label="Conversation" className="overflow-hidden rounded-2xl bg-stage">
          {/* The element fills this box; portrait on phones, 16:9 from sm up. */}
          <div className="aspect-[9/16] w-full sm:aspect-video">
            <TavusInterviewer
              controllerRef={controller}
              capSeconds={session.capSeconds}
              onStarted={onStarted}
              onUtterance={onUtterance}
              onEnded={finish}
              onProblem={setProblem}
            />
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-card p-5">
            <p className="text-sm text-muted">Time remaining</p>
            <p className={`mt-1 font-display text-5xl tabular-nums ${warning ? "text-warn" : ""}`}>
              {fmtTime(remaining)}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
              <div
                className={`h-full ${warning ? "bg-warn" : "bg-accent"}`}
                style={{ width: `${Math.min(100, (elapsed / session.capSeconds) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              {startedAt
                ? `Ends automatically at ${fmtTime(session.capSeconds)}.`
                : "The clock starts when the call connects."}
            </p>
            {warning && (
              <p role="status" className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
                About a minute left. The interviewer will wrap up with a read-back.
              </p>
            )}
            {problem && (
              <div role="alert" className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
                <p>{problem}</p>
                {!startedAt && (
                  <Link href="/" className="mt-1 inline-block underline underline-offset-4">
                    Back to the brief
                  </Link>
                )}
              </div>
            )}
            <button
              onClick={() => finish("ended_by_candidate")}
              className="mt-4 w-full rounded-full border border-ink px-4 py-2.5 font-medium hover:bg-ink hover:text-paper"
            >
              End conversation
            </button>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5 text-sm">
            <p className="font-medium">How it goes</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
              {AGENDA.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
            <p className="mt-4 text-muted">Ask for clarification, more time or other questions on your mind.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
