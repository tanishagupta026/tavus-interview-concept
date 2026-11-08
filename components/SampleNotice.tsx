export function SampleNotice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="rounded-lg border border-line bg-card px-4 py-3 text-sm">
      <span className="font-medium">Sample data.</span> <span className="text-muted">{children}</span>
    </p>
  );
}
