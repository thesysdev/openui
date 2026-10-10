"use client";

import { useEffect, useRef, useState } from "react";
import { LEFT_EYE, MASCOT_BODY_PATHS, RIGHT_EYE } from "./welcome-mascot-paths";
import styles from "./welcome-mascot.module.css";

// How far (in SVG units, the logo is 201 wide) the eyes may drift from rest.
const MAX_OFFSET = 2;
// The eyes only follow the cursor within this distance (CSS px) of the mascot.
const NEAR_PX = 180;
// Fraction of the remaining distance covered per frame. Lower is lazier.
const EASE = 0.08;
// The white glint drifts this much further than the eye, for a hint of depth.
const GLINT_EXTRA = 0.35;

const EYES = [LEFT_EYE, RIGHT_EYE];

// Welcome-screen mascot. Blinks once when it first appears, its eyes gently
// follow the cursor only while it is nearby, and it squishes when clicked.
// Static when the user prefers reduced motion.
export function WelcomeMascot({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const eyeRefs = useRef<(SVGGElement | null)[]>([]);
  const glintRefs = useRef<(SVGPathElement | null)[]>([]);
  const [blinking, setBlinking] = useState(false);
  const [squish, setSquish] = useState(0);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = EYES.map(() => ({ x: 0, y: 0 }));
    const current = EYES.map(() => ({ x: 0, y: 0 }));
    let frame = 0;

    const tick = () => {
      let moving = false;
      current.forEach((c, i) => {
        c.x += (target[i].x - c.x) * EASE;
        c.y += (target[i].y - c.y) * EASE;
        if (Math.abs(target[i].x - c.x) > 0.01 || Math.abs(target[i].y - c.y) > 0.01) moving = true;
        eyeRefs.current[i]?.setAttribute("transform", `translate(${c.x.toFixed(3)} ${c.y.toFixed(3)})`);
        glintRefs.current[i]?.setAttribute(
          "transform",
          `translate(${(c.x * GLINT_EXTRA).toFixed(3)} ${(c.y * GLINT_EXTRA).toFixed(3)})`,
        );
      });
      frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      const near =
        Math.hypot(
          e.clientX - (rect.left + rect.width / 2),
          e.clientY - (rect.top + rect.height / 2),
        ) < NEAR_PX;
      const scale = rect.width / 201;
      EYES.forEach((eye, i) => {
        if (!near) {
          target[i] = { x: 0, y: 0 };
          return;
        }
        const dx = e.clientX - (rect.left + eye.cx * scale);
        const dy = e.clientY - (rect.top + eye.cy * scale);
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(dist / NEAR_PX, 1) * MAX_OFFSET;
        target[i] = { x: (dx / dist) * reach, y: (dy / dist) * reach };
      });
      kick();
    };

    const onLeave = () => {
      target.forEach((t) => {
        t.x = 0;
        t.y = 0;
      });
      kick();
    };

    // A single hello blink shortly after the mascot first appears.
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setBlinking(true), 600));
    timers.push(setTimeout(() => setBlinking(false), 760));

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, []);

  const onPress = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Bumping the key restarts the squish animation on every click.
    setSquish((n) => n + 1);
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 201 161"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="OpenUI"
      className={[styles.mascot, className].filter(Boolean).join(" ")}
      onPointerDown={onPress}
    >
      <g key={squish} className={squish ? styles.squish : undefined}>
        {MASCOT_BODY_PATHS.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} />
        ))}
        {EYES.map((eye, i) => (
          <g
            key={i}
            className={styles.lid}
            style={{ transformOrigin: `${eye.cx}px ${eye.cy}px` }}
            data-blinking={blinking || undefined}
          >
            <g ref={(el) => void (eyeRefs.current[i] = el)}>
              <path d={eye.eye} fill="black" />
              <path ref={(el) => void (glintRefs.current[i] = el)} d={eye.glint} fill="white" />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}
