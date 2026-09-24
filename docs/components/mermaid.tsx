"use client";

import { useTheme } from "next-themes";
import localFont from "next/font/local";
import { useEffect, useId, useState } from "react";

const excalifont = localFont({
  src: "./fonts/excalifont/regular.woff2",
  weight: "400",
  display: "swap",
  preload: false,
});

/**
 * Renders a Mermaid diagram client-side.
 * Usage in MDX: <Mermaid chart={`sequenceDiagram\n  A->>B: hello`} />
 */
export function Mermaid({
  chart,
  look = "classic",
}: {
  chart: string;
  look?: "classic" | "handDrawn";
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { default: mermaid } = await import("mermaid");
      if (look === "handDrawn") {
        await document.fonts.load(`17px ${excalifont.style.fontFamily}`);
      }
      if (cancelled) return;
      mermaid.initialize({
        startOnLoad: false,
        theme: resolvedTheme === "dark" ? "dark" : "neutral",
        look,
        handDrawnSeed: 42,
        fontFamily: look === "handDrawn" ? excalifont.style.fontFamily : "inherit",
        ...(look === "handDrawn" && {
          themeVariables: {
            fontSize: "17px",
            edgeLabelBackground: "transparent",
          },
          themeCSS:
            ".edgeLabel .labelBkg, .edgeLabel p { background-color: var(--color-doc-surface) !important; }",
        }),
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
  }, [chart, id, look, resolvedTheme]);

  return (
    <div
      className={`not-prose my-6 flex justify-center overflow-x-auto [&_svg]:max-w-full ${look === "handDrawn" ? excalifont.className : ""}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
