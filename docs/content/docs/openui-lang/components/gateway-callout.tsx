import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface GatewayCalloutProps {
  description: string;
}

export function GatewayCallout({ description }: GatewayCalloutProps) {
  return (
    <aside className="not-prose my-6 rounded-xl border border-fd-border bg-fd-muted/30 px-4 py-3.5 text-fd-foreground">
      <p className="m-0 text-base leading-7">{description}</p>
      <Link
        href="/docs/gateway"
        className="group mt-3 inline-flex items-center gap-1.5 rounded-lg border border-fd-border bg-transparent px-3 py-1.5 text-sm font-semibold text-fd-foreground no-underline transition-colors hover:bg-fd-accent/60 focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Explore the Gateway
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </aside>
  );
}
