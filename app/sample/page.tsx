import { CandidateReadback, CloseMessage } from "@/components/CandidateReadback";
import { SampleNotice } from "@/components/SampleNotice";
import { Stepper } from "@/components/Stepper";

// M8: what the candidate sees after a conversation, reachable directly so the demo never depends on a live session.
export default function SamplePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Stepper current={2} />
      <p className="mt-12 font-mono text-xs tracking-[0.2em] text-eyebrow uppercase">That&rsquo;s a wrap</p>
      <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight sm:text-7xl">
        Thanks for the conversation.
      </h1>
      <CloseMessage />
      <div className="mt-10 space-y-6">
        <SampleNotice>An example of what the candidate sees after a conversation.</SampleNotice>
        <CandidateReadback />
      </div>
    </div>
  );
}
