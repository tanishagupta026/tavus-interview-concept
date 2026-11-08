"use client";

// Registers <tavus-embed>. Static on purpose; this module is loaded client-only
// (next/dynamic with ssr: false) because the element touches browser APIs.
import "@tavus/embed";
import { TavusIntegration } from "@tavus/embed";
import { useEffect, useRef, type RefObject } from "react";
import type { EndReason } from "@/lib/clientSession";
import { END_INTERVIEW_TOOL, TAVUS_DEPLOYMENT_ID } from "@/lib/tavusDeployment";

export type InterviewerController = {
  /** Leaves the call (or cancels a start still pending). */
  end: () => void;
  /** Tells the agent something mid-call. No-op before the call connects. */
  addContext: (context: string) => void;
};

type Props = {
  controllerRef: RefObject<InterviewerController | null>;
  capSeconds: number;
  onStarted: (conversationId: string) => void;
  onUtterance: (speaker: "interviewer" | "candidate", text: string) => void;
  /** The call ended from inside the element (its leave button) or via the end_interview tool. */
  onEnded: (reason: EndReason) => void;
  onProblem: (message: string) => void;
};

// Captions on; the device check stays, so the candidate can confirm camera and mic.
const OVERRIDE_CONFIG = JSON.stringify({
  customization: { conversation: { enable_closed_captions: true } },
});

const context = (capSeconds: number) =>
  `This is a short, timed interview inside a concept demo, capped at ${Math.round(capSeconds / 60)} minutes. ` +
  `Do not score the candidate or say how they did. When the closing read-back is done and you have said goodbye, ` +
  `call the ${END_INTERVIEW_TOOL} tool.`;

type Utterance = { event_type?: string; properties?: { role?: string; speech?: string; final?: unknown } };

export default function TavusInterviewer({ controllerRef, capSeconds, ...handlers }: Props) {
  const h = useRef(handlers);
  h.current = handlers;

  useEffect(() => {
    if (!TAVUS_DEPLOYMENT_ID) return;
    const tavus = new TavusIntegration("tavus-embed");
    let live = false;

    controllerRef.current = {
      end: () => tavus.endConversation(),
      addContext: (context) => {
        if (live) tavus.sendMessage({ event_type: "conversation.append_llm_context", properties: { context } });
      },
    };

    // The candidate already pressed Start on the brief, so open the call (device check first) right away.
    const onReady = () => tavus.startConversation();
    const onStarted = (e: CustomEvent<{ conversationId: string }>) => {
      live = true;
      h.current.onStarted(e.detail.conversationId);
    };
    const onEnded = () => {
      live = false;
      h.current.onEnded("ended_by_candidate");
    };
    const onError = (e: CustomEvent<{ code: string; message: string }>) =>
      h.current.onProblem(e.detail.message || e.detail.code);
    const onMode = (e: CustomEvent<{ mode: string }>) => {
      if (e.detail.mode === "unavailable") h.current.onProblem("The AI interviewer is unavailable right now.");
    };
    const onProtocol = (e: CustomEvent<unknown>) => {
      const d = e.detail as Utterance;
      if (d?.event_type !== "conversation.utterance") return;
      const p = d.properties;
      // Streaming partials carry a boolean `final`; complete utterances have none.
      if (!p || typeof p.final === "boolean" || !p.speech?.trim()) return;
      h.current.onUtterance(p.role === "user" ? "candidate" : "interviewer", p.speech.trim());
    };
    const onTool = (e: CustomEvent<{ name: string; arguments: string; tool_call_id?: string }>) => {
      const { name, tool_call_id } = e.detail;
      if (name !== END_INTERVIEW_TOOL) return;
      if (tool_call_id) {
        tavus.sendMessage({
          event_type: "conversation.tool_result",
          properties: { tool_call_id, output: { ended: true }, status: "success" },
        });
      }
      live = false;
      h.current.onEnded("ended_by_interviewer");
    };

    tavus.on("tavus:ready", onReady);
    tavus.on("tavus:conversation-started", onStarted);
    tavus.on("tavus:conversation-ended", onEnded);
    tavus.on("tavus:error", onError);
    tavus.on("tavus:mode-change", onMode);
    tavus.on("tavus:protocol-message", onProtocol);
    tavus.on("tavus:tool-call", onTool);
    return () => {
      tavus.off("tavus:ready", onReady);
      tavus.off("tavus:conversation-started", onStarted);
      tavus.off("tavus:conversation-ended", onEnded);
      tavus.off("tavus:error", onError);
      tavus.off("tavus:mode-change", onMode);
      tavus.off("tavus:protocol-message", onProtocol);
      tavus.off("tavus:tool-call", onTool);
      controllerRef.current = null;
    };
  }, [controllerRef]);

  if (!TAVUS_DEPLOYMENT_ID) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-white/80">
        No Tavus deployment id is set (lib/tavusDeployment.ts), so the interviewer can&rsquo;t load.
      </div>
    );
  }

  return (
    <tavus-embed
      deployment-id={TAVUS_DEPLOYMENT_ID}
      override-config={OVERRIDE_CONFIG}
      conversational-context={context(capSeconds)}
    />
  );
}
