"use client";

import { useTheme } from "next-themes";
import { useEffect, useId, useState } from "react";

/**
 * Renders a Mermaid diagram client-side.
 * Usage in MDX: <Mermaid chart={`sequenceDiagram\n  A->>B: hello`} />
 */
export function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { default: mermaid } = await import("mermaid");
      mermaid.initialize({
        startOnLoad: false,
        theme: resolvedTheme === "dark" ? "dark" : "neutral",
        fontFamily: "inherit",
      });
      try {
        const { svg } = await mermaid.render(`mmd-${id}`, chart.trim());
        if (!cancelled) setSvg(svg);
      } catch {
        // Leave the container empty rather than crash the page on a syntax error.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id, resolvedTheme]);

  return (
    <div
      className="not-prose my-6 flex justify-center overflow-x-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
