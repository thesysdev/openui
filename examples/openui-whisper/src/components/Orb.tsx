"use client";

import { useEffect, useRef, type RefObject } from "react";

export type OrbMode = "off" | "listening" | "hearing" | "thinking";

const PALETTE: Record<OrbMode, { core: string; glow: string }> = {
  off: { core: "#3a3a44", glow: "rgba(120,120,140,0.25)" },
  listening: { core: "#38bdf8", glow: "rgba(56,189,248,0.55)" },
  hearing: { core: "#22d3ee", glow: "rgba(34,211,238,0.85)" },
  thinking: { core: "#c084fc", glow: "rgba(192,132,252,0.8)" },
};

type Props = {
  mode: OrbMode;
  /** Live 0..1 input level. Read imperatively each frame — never triggers a re-render. */
  levelRef: RefObject<number>;
  size: number;
};

export function Orb({ mode, levelRef, size }: Props) {
  const coreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let raf = 0;
    let smoothed = 0;
    const animate = () => {
      // Hearing scales the orb with the voice; other modes settle to a calm baseline.
      const target = mode === "hearing" ? levelRef.current ?? 0 : 0;
      smoothed += (target - smoothed) * 0.2;
      const core = coreRef.current;
      if (core) {
        const scale = 1 + smoothed * 0.4;
        const glow = 0.6 + smoothed * 0.4;
        core.style.transform = `scale(${scale.toFixed(3)})`;
        core.style.setProperty("--orb-glow-strength", glow.toFixed(3));
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [mode, levelRef]);

  const { core, glow } = PALETTE[mode];
  // Only idle "listening" breathes via CSS; "hearing" is driven by the JS transform
  // above (a CSS animation would otherwise override the voice-reactive scale).
  const breathing = mode === "listening";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          animation: mode === "off" ? "none" : "orb-halo 3.4s ease-in-out infinite",
        }}
      />
      {mode === "thinking" && (
        <div
          className="absolute rounded-full"
          style={{
            inset: size * 0.12,
            background: `conic-gradient(from 0deg, transparent 0%, ${glow} 35%, transparent 60%)`,
            animation: "orb-spin 1.6s linear infinite",
            filter: "blur(2px)",
          }}
        />
      )}
      <div
        ref={coreRef}
        className="relative rounded-full"
        style={{
          width: size * 0.62,
          height: size * 0.62,
          background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${core} 45%, ${core} 100%)`,
          boxShadow: `0 0 calc(${size * 0.5}px * var(--orb-glow-strength, 0.6)) ${glow}`,
          animation: breathing ? "orb-breathe 3.4s ease-in-out infinite" : "none",
          transition: "background 0.6s ease",
          ["--orb-glow-strength" as string]: "0.6",
        }}
      />
    </div>
  );
}
