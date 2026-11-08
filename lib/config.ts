// Server-only configuration. Never import this from a client component:
// nothing here may reach the browser (M1).
function num(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  accessCodes: (process.env.ACCESS_CODES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  /** Hard cap for one session, in seconds. Keep it at or under the Tavus plan's limit. */
  sessionCapSeconds: num(process.env.SESSION_CAP_SECONDS, 300),
  warnSeconds: 60,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  /** Signs the per-session ticket that lets a finished session email its transcript. */
  sessionSecret: process.env.SESSION_SECRET ?? "",
  /** Email on every conversation, sent by your Google Apps Script web app. Empty turns it off. */
  notifyWebhookUrl: process.env.NOTIFY_WEBHOOK_URL?.trim() ?? "",
  /** Shared with the script (its NOTIFY_SECRET property), so the URL alone can't send mail. */
  notifyWebhookSecret: process.env.NOTIFY_WEBHOOK_SECRET?.trim() ?? "",
};

export class NotWiredUp extends Error {
  constructor(what: string) {
    super(`${what} isn't connected yet.`);
  }
}
