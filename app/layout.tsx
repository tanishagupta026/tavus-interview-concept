import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const ui = Geist({ variable: "--font-ui", subsets: ["latin"] });
const code = Geist_Mono({ variable: "--font-code", subsets: ["latin"] });
const text = Source_Serif_4({ variable: "--font-text", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tenex AI Interview Concept",
  description:
    "Concept demo: a short, two-way AI interview conversation with a human-reviewed summary. Not affiliated with any employer.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${ui.variable} ${code.variable} ${text.variable} flex min-h-dvh flex-col antialiased`}>
        <header className="px-4 pt-4 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 rounded-3xl bg-card sm:rounded-full px-5 py-3 shadow-[0_6px_24px_rgba(20,20,19,0.08)] sm:px-6">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span aria-hidden className="h-2.5 w-2.5 rounded-[2px] bg-accent" />
              Tenex AI Interview Concept
            </Link>
            <span className="text-xs text-muted">Concept demo · not affiliated with any employer</span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line">
          <div className="ui mx-auto max-w-6xl px-4 py-4 text-xs text-muted sm:px-6">
            Independent concept proposed by{" "}
            <a
              href="https://www.linkedin.com/in/tanisha-gupta-gen-ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline decoration-accent decoration-2 underline-offset-4"
            >
              Tanisha
            </a>
            . Ideally a person makes every decision, but this is a fake interview, so no decisions are made.
          </div>
        </footer>
      </body>
    </html>
  );
}
