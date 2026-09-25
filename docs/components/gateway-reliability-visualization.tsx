export function GatewayReliabilityVisualization() {
  return (
    <div
      className="not-prose my-6 rounded-2xl border border-fd-border bg-fd-muted/20 p-4 sm:p-6"
      role="img"
      aria-label="A request travels from an application through OpenUI Gateway to an LLM. The LLM streams generated UI through OpenUI Gateway, which validates the stream continuously, fixes errors as they are detected, and forwards the validated stream to the application."
    >
      <div className="grid items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1.15fr)_7rem_minmax(0,1fr)]">
        <div className="flex min-h-40 flex-col rounded-xl border border-fd-border bg-fd-background p-4">
          <div className="text-sm font-semibold text-fd-foreground">Your application</div>
          <div className="mt-4 flex flex-1 flex-col gap-2 rounded-lg border border-fd-border bg-fd-muted/40 p-3">
            <div className="h-2 w-2/3 rounded-full bg-fd-muted-foreground/25" />
            <div className="h-2 w-1/2 rounded-full bg-fd-muted-foreground/20" />
            <div className="mt-2 flex-1 rounded-md border border-[color:color-mix(in_srgb,var(--openui-text-success-primary)_25%,transparent)] bg-[var(--openui-success-background)] p-2">
              <div className="text-xs font-medium text-[var(--openui-text-success-primary)]">
                Generated interface
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-fd-muted-foreground/20" />
              <div className="mt-2 h-2 w-3/4 rounded-full bg-fd-muted-foreground/20" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-around py-1 text-xs font-medium text-fd-muted-foreground md:hidden">
          <div className="flex flex-col items-center gap-1">
            <span>Request</span>
            <span className="text-lg" aria-hidden="true">
              ↓
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 text-[var(--openui-text-success-primary)]">
            <span aria-hidden="true">↑</span>
            <span>Validated UI</span>
          </div>
        </div>
        <div className="hidden flex-col items-center justify-center gap-10 text-xs font-medium md:flex">
          <div className="whitespace-nowrap text-fd-muted-foreground">Request →</div>
          <div className="whitespace-nowrap text-[var(--openui-text-success-primary)]">
            ← Validated UI
          </div>
        </div>

        <div className="flex min-h-40 flex-col rounded-xl border border-[var(--openui-text-purple-primary)] bg-[var(--openui-purple-background)] p-4 shadow-sm">
          <div className="text-sm font-semibold text-fd-foreground">OpenUI Gateway</div>
          <div className="text-xs font-medium text-[var(--openui-text-purple-primary)]">
            Reliability middleware
          </div>
          <div className="mt-4 flex flex-1 flex-col justify-center gap-2">
            <div className="rounded-lg border border-[color:color-mix(in_srgb,var(--openui-text-purple-primary)_30%,transparent)] bg-fd-background/70 px-3 py-2 text-xs font-medium text-fd-foreground">
              Validate generated UI
            </div>
            <div className="rounded-lg border border-[color:color-mix(in_srgb,var(--openui-text-purple-primary)_30%,transparent)] bg-fd-background/70 px-3 py-2 text-xs font-medium text-fd-foreground">
              Fix errors automatically
            </div>
          </div>
        </div>

        <div className="flex items-center justify-around py-1 text-xs font-medium text-fd-muted-foreground md:hidden">
          <div className="flex flex-col items-center gap-1">
            <span>Model request</span>
            <span className="text-lg" aria-hidden="true">
              ↓
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 text-[var(--openui-text-alert-primary)]">
            <span aria-hidden="true">↑</span>
            <span>Generated UI</span>
          </div>
        </div>
        <div className="hidden flex-col items-center justify-center gap-10 text-xs font-medium text-fd-muted-foreground md:flex">
          <div className="whitespace-nowrap">Model request →</div>
          <div className="whitespace-nowrap text-[var(--openui-text-alert-primary)]">
            ← Generated UI
          </div>
        </div>

        <div className="flex min-h-40 flex-col rounded-xl border border-fd-border bg-fd-background p-4">
          <div className="text-sm font-semibold text-fd-foreground">LLM</div>
          <div className="text-xs text-fd-muted-foreground">OpenAI, Anthropic, and others</div>
          <div className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--openui-text-alert-primary)_25%,transparent)] bg-[var(--openui-alert-background)] px-3 text-center text-xs font-medium text-[var(--openui-text-alert-primary)]">
            Generate interface
          </div>
        </div>
      </div>
    </div>
  );
}
