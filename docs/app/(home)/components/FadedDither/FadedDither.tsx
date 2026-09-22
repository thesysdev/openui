"use client";

import dynamic from "next/dynamic";
import { type CSSProperties, useEffect, useState } from "react";

/* WebGPU only exists in the browser, so the canvas is loaded on the client and
   never rendered on the server. Use this rather than FadedDitherCanvas. */
const FadedDitherCanvas = dynamic(
  () => import("./FadedDitherCanvas").then((m) => m.FadedDitherCanvas),
  { ssr: false },
);

/* The same breakpoint the stages use. The wave follows the viewport, not the
   canvas: a stage can be half a wide page and still wants the page's wave, so
   that every shader on a given screen reads as the same material. */
const COMPACT_QUERY = "(max-width: 767px)";

/* The page theme, watched rather than read once: the site can change it after
   mount, and this component has to follow. */
function usePageTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      setTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");
    };

    read();
    const watch = new MutationObserver(read);
    watch.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => watch.disconnect();
  }, []);

  return theme;
}

export function FadedDither({
  band = "light",
  className,
  style,
}: {
  /* The band's own tone, not the picture's. A light band is white on a light
     page and black on a dark one; a dark band is the other way round, because
     it inverts. Either way the shader has to match the ground it lands on. */
  band?: "light" | "dark";
  className?: string;
  style?: CSSProperties;
}) {
  const theme = usePageTheme();
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY);
    const read = () => setCompact(query.matches);

    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  const onLightGround = (band === "light") === (theme === "light");
  const tone = onLightGround ? "light" : "dark";

  /* The wrapper carries the positioning and puts the resolved tone and width
     mode in the DOM, where they can be read without going through React
     internals, which double-buffer and will hand back a stale tree. */
  return (
    <div className={className} data-compact={compact || undefined} data-tone={tone} style={style}>
      <FadedDitherCanvas compact={compact} tone={tone} />
    </div>
  );
}
