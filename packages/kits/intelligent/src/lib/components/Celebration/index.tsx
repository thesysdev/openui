"use client";

import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CelebrationSchema } from "./schema";

export * from "./schema";

const CONFETTI = ["var(--iui-chart-1)", "var(--iui-chart-2)", "var(--iui-chart-3)", "var(--iui-chart-4)", "var(--iui-chart-5)", "var(--iui-chart-6)"];

export const Celebration = defineComponent({
  name: "Celebration",
  props: CelebrationSchema,
  description: "Bursts confetti when its condition turns true, e.g. Celebration($score == 5) at the end of a quiz.",
  component: function CelebrationView({ props }) {
    const streaming = useIsStreaming();
    const [burst, setBurst] = useState(0);
    const was = useRef<boolean | null>(null);
    useEffect(() => {
      if (streaming) return;
      const now = props.when === true;
      if (was.current === false && now) setBurst((n) => n + 1);
      was.current = now;
    }, [props.when, streaming]);
    useEffect(() => {
      if (!burst) return;
      const t = setTimeout(() => setBurst(0), 2200);
      return () => clearTimeout(t);
    }, [burst]);
    if (!burst || typeof document === "undefined") return null;
    return createPortal(
      <div className="iui-confetti" aria-hidden key={burst}>
        {Array.from({ length: 70 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              background: CONFETTI[i % CONFETTI.length],
              animationDelay: `${(i % 10) * 40}ms`,
              animationDuration: `${1200 + ((i * 53) % 900)}ms`,
              ["--x" as string]: `${((i * 71) % 200) - 100}px`,
              ["--r" as string]: `${(i * 97) % 720}deg`,
            }}
          />
        ))}
      </div>,
      document.body,
    );
  },
});
