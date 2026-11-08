import type { Utterance } from "./summary";

// Per-tab session state for the demo flow. sessionStorage can throw (private mode,
// blocked storage), so every access is guarded and callers must handle null.
export type EndReason = "ended_by_candidate" | "ended_by_interviewer" | "time_cap";

export type StoredSession = {
  capSeconds: number;
  warnSeconds: number;
  /** Set by the Tavus element when the call connects. */
  conversationId?: string;
  /** Wall-clock start of the first connected call; the cap counts from here. */
  startedAt?: number;
  endedAt?: number;
  elapsedSeconds?: number;
  endReason?: EndReason;
  /** Complete utterances captured live from the call, t in seconds from startedAt. */
  utterances?: Utterance[];
  additions?: string;
  /** Signed ticket from the access gate; lets this session email its transcript. */
  token?: string;
  /** Set once the end-of-conversation email has been requested. */
  notified?: boolean;
};

const KEY = "twi.session";

export function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: StoredSession): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore: the flow falls back to the sample read-back
  }
}

export function updateSession(patch: Partial<StoredSession>): StoredSession | null {
  const current = loadSession();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveSession(next);
  return next;
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
