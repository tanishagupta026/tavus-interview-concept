import { loadSession, type StoredSession } from "./clientSession";

type Kind = "ended" | "left_page" | "addition";

function body(kind: Kind, s: StoredSession): string | null {
  if (!s.token || !s.startedAt) return null;
  return JSON.stringify({
    token: s.token,
    kind,
    transcript: { conversationId: s.conversationId ?? "unknown", source: "live", utterances: s.utterances ?? [] },
    additions: s.additions ?? "",
    endReason: s.endReason,
    elapsedSeconds: s.elapsedSeconds ?? Math.round((Date.now() - s.startedAt) / 1000),
  });
}

/**
 * Tells the server to email the owner. Fire and forget: the candidate never sees a
 * failure, and nothing is sent for sessions that never connected.
 */
export function notifyOwner(kind: Kind): void {
  const s = loadSession();
  const b = s && body(kind, s);
  if (!b) return;
  // On page exit only a beacon survives; otherwise keepalive covers route changes.
  if (kind === "left_page" && navigator.sendBeacon?.("/api/notify", b)) return;
  fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: b,
    keepalive: b.length < 60_000,
  }).catch(() => {});
}
