/**
 * Placeholder for a screenshot, GIF, or gallery that will be added later.
 * Usage in MDX: <FakeVisual label="Chat with an inline revenue chart" />
 */
export function FakeVisual({ label, height = 320 }: { label: string; height?: number }) {
  return (
    <div
      style={{ height }}
      className="not-prose my-6 flex w-full items-center justify-center rounded-xl border border-dashed border-fd-border bg-fd-muted/50"
    >
      <span className="max-w-md px-6 text-center text-sm text-fd-muted-foreground">{label}</span>
    </div>
  );
}
