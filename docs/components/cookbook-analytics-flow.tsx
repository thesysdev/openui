export function CookbookAnalyticsFlow() {
  const steps = [
    {
      title: "Ask a question",
      description: "Start a conversation in Agent Interface.",
      detail: "How did February sales compare with January?",
    },
    {
      title: "Get the data",
      description:
        "OpenUI Cloud calls query_sales. Your server queries SQLite and returns the results.",
      detail: "Sales totals, daily trends, and product comparisons",
    },
    {
      title: "See the answer",
      description:
        "Cloud streams the answer into Agent Interface as text, metrics, charts, or tables.",
      detail: "Ask a follow-up to explore further.",
    },
  ];

  return (
    <figure className="not-prose my-6" aria-label="How conversational analytics works">
      <ol className="m-0 list-none divide-y divide-fd-border overflow-hidden rounded-xl border border-fd-border p-0">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4 px-5 py-5">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fd-secondary text-sm font-semibold text-fd-foreground"
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="m-0 text-base font-semibold leading-8 text-fd-foreground">
                {step.title}
              </h3>
              <p className="mt-1 mb-0 text-sm leading-6 text-fd-muted-foreground">
                {step.description}
              </p>
              <p className="mt-2 mb-0 text-sm leading-6 text-fd-foreground">
                {index === 0 ? `“${step.detail}”` : step.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
