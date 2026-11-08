# Tenex AI Interview Concept

A short, two-way AI interview with a human-reviewed, unscored summary. Independent concept, not affiliated with any employer.

## Run it

Requires 64-bit Node.js (Tailwind and Next.js have no 32-bit Windows binaries).

```bash
cp .env.example .env.local   # ACCESS_CODES=demo-2026
npm install
npm run dev                  # http://localhost:3000
npm test
```

The conversation step runs a live Tavus PAL through the `<tavus-embed>` element (`@tavus/embed`, deployment id in `lib/tavusDeployment.ts`). The browser talks to Tavus with the deployment id alone: no Tavus API key, no backend call. Every run uses real Tavus minutes. `/sample` and `/recruiter` without a session show the pre-generated sample.

## Tavus portal setup

- **Allowed origins:** add `http://localhost:3000` and the deployed origin, or the element shows "PAL is unavailable".
- **Captions** are turned on from the page (`override-config`, `conversation.enable_closed_captions`); the device check stays on.
- **Tool `end_interview`:** add it to the PAL in the PAL Maker so the interviewer can end the call itself after the read-back:

  | Field | Value |
  |---|---|
  | Name | `end_interview` |
  | Description | Ends the interview and takes the candidate to their read-back. Call it only after the closing read-back is done and you have said goodbye, or when the candidate clearly asks to stop. |
  | Delivery | App message (`delivery: { app_message: true }`) |
  | On resolve | `fire_and_forget` |

  ```json
  {
    "type": "object",
    "properties": {
      "reason": {
        "type": "string",
        "enum": ["completed", "candidate_requested"],
        "description": "Why the interview is ending."
      }
    },
    "required": ["reason"]
  }
  ```

## How a session works

1. The brief checks the access code and consent (`/api/conversation`), then opens `/session`.
2. `/session` mounts `<tavus-embed>` and starts the call when the element is ready (device check first). The 5-minute clock starts at `tavus:conversation-started`. At 1 minute left the page tells the agent to wrap up (`append_llm_context`). At the cap, or on End, the page ends the call.
3. Complete utterances (`tavus:protocol-message`, `conversation.utterance` with no `final` field) are saved in this tab's sessionStorage as the transcript.
4. `/close` tells the candidate a person will read the transcript and decide, and lets them add something they missed. `/recruiter` sends the transcript to `/api/summary`; the AI summary isn't connected yet, so the recruiter sees the full transcript with a note.

## Email on every conversation

When a call ends (End, the interviewer's `end_interview`, or the time cap), the browser posts the transcript to `/api/notify`. The server passes it to a Google Apps Script web app in your account, which emails you from your Gmail with the transcript attached as a `.txt`. You also get an email if someone closes the tab mid-call, and another if the candidate adds a note on `/close`.

Setup (about 5 minutes):

1. Go to script.google.com → New project. Replace the editor contents with `apps-script/Code.gs`. To send somewhere other than your own Gmail, set `SEND_TO`.
2. Project Settings (gear) → Script Properties → Add: `NOTIFY_SECRET` = the `NOTIFY_WEBHOOK_SECRET` value from `.env.local`.
3. Back in the editor, pick `testEmail` in the function menu and press Run. Approve the permission prompt ("Google hasn't verified this app" → Advanced → Go to project; it's your own script). Check the test email arrives.
4. Deploy → New deployment → type Web app. Execute as: Me. Who has access: Anyone. Deploy, and copy the URL ending in `/exec`.
5. Put it in `NOTIFY_WEBHOOK_URL` (in `.env.local`, and in Vercel for production) and restart the app.

Notes:

- "Anyone" means anyone with the URL can call the script, but it only sends mail when the secret matches.
- After editing the script, use Deploy → Manage deployments → edit → New version, or the URL keeps running the old code.
- Gmail allows about 100 script emails a day on a free account.
- Only sessions that passed the access gate can send: `/api/conversation` hands out a ticket signed with `SESSION_SECRET` (valid 2 hours), and `/api/notify` checks it and rate-limits per session and per IP.
- With `NOTIFY_WEBHOOK_URL` empty, emails are off and nothing else changes.
- The transcript is captured in the browser, so a session that crashes or loses power before the end sends nothing.

## Deploy (Vercel)

1. Push this folder to a GitHub repo and import it at vercel.com/new (framework: Next.js, no build settings to change), or run `npx vercel` here.
2. In Vercel → Settings → Environment Variables (Production), set `ACCESS_CODES`, `SESSION_CAP_SECONDS`, `NOTIFY_WEBHOOK_URL`, `NOTIFY_WEBHOOK_SECRET` (must match the script's `NOTIFY_SECRET`) and `SESSION_SECRET` (a new long random string, not the local one). Redeploy after changing them.
3. In the Tavus portal, add the production URL (for example `https://your-app.vercel.app`) to the deployment's allowed origins, or the interviewer won't load.
4. Run one real conversation on the live URL and check the email arrives.

## Layout

- `app/page.tsx`, `components/PreBriefCard.tsx`: brief (AI disclosure, consent, access code)
- `app/session/page.tsx`, `components/TavusInterviewer.tsx`: Tavus call, timer, 60 s nudge, hard cap, transcript capture, `end_interview` handler
- `app/close/page.tsx`, `components/CandidateReadback.tsx`: candidate close screen (a person reviews the transcript) and "Add something I missed"
- `app/recruiter/page.tsx`, `components/RecruiterSummary.tsx`: recruiter mode (summary, quotes, gaps, transcript download)
- `app/api/*`: access gate (code and rate limit) and summary; keys stay server-side
- `lib/summary.ts`: summary schema (no score fields allowed) and verbatim quote verification
- `lib/summarize.ts`: summary step; the Claude call is the next piece to wire up
- `fixtures/`: sample transcript and summary
