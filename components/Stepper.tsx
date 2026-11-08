const STEPS = ["Brief", "Conversation", "Next steps"] as const;

// Numbered tabs on a hairline; the current step is underlined in yellow, finished steps get a check.
export function Stepper({ current }: { current: 0 | 1 | 2 }) {
  return (
    <nav aria-label="Progress" className="w-full border-b border-line">
      <ol className="grid max-w-2xl grid-cols-3 text-xs sm:text-sm">
        {STEPS.map((label, i) => {
          const state = i < current ? "done" : i === current ? "current" : "todo";
          return (
            <li
              key={label}
              aria-current={state === "current" ? "step" : undefined}
              className={`-mb-px flex items-center gap-2 border-b-2 py-3 pr-2 whitespace-nowrap ${
                state === "current" ? "border-accent font-medium text-ink" : "border-transparent text-muted"
              }`}
            >
              <span className="font-mono text-[0.7rem] text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span>{label}</span>
              {state === "done" && (
                <svg aria-label="done" viewBox="0 0 16 16" className="ml-auto hidden h-3.5 w-3.5 shrink-0 text-ink sm:mr-6 sm:block">
                  <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
