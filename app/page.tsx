import { PreBriefCard } from "@/components/PreBriefCard";
import { Stepper } from "@/components/Stepper";

const POINTS = [
  ["Pushback you can answer", "The interviewer raises objections and responds to what you actually say."],
  ["Ask anything, any time", "Ask for clarification mid-answer or take a pause."],
] as const;

export default function BriefPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Stepper current={0} />
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <section>
          <p className="font-mono text-xs tracking-[0.2em] text-eyebrow uppercase">A reimagined candidate interview</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.04] tracking-tight sm:text-6xl">
            Reimagining recorded video interviews as conversations.
          </h1>
          <p className="mt-8 max-w-xl font-display text-2xl">Interviews Should Be Conversations.</p>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-muted">
            One-way video interviews force candidates to speak to a silent camera under a countdown—no feedback, no
            follow-up. I rebuilt the process as a live dialogue with an AI interviewer that engages back-and-forth in
            real time.
          </p>
          <ul className="mt-8 space-y-5">
            {POINTS.map(([title, body]) => (
              <li key={title} className="flex gap-4">
                <span aria-hidden className="mt-2.5 h-2 w-2 shrink-0 rounded-[2px] bg-accent" />
                <div>
                  <p className="ui font-medium">{title}</p>
                  <p className="text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <PreBriefCard />
      </div>
    </div>
  );
}
