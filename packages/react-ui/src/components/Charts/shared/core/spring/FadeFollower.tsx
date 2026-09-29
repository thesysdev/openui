import React from "react";

import { springPresets } from "./presets";
import type { SpringConfig } from "./spring";
import { useSeededAim } from "./useSeededAim";
import { useTranslate } from "./useTranslate";

interface FadeFollowerProps {
  /** Spring target in chart coordinates. Ignored while `!visible`. */
  x: number;
  /** Default 0 — most followers slide along one axis. */
  y?: number;
  visible: boolean;
  /** Default springPresets.crosshair. */
  config?: SpringConfig;
  /** Opacity-fade duration on show/hide. Default 120. */
  fadeMs?: number;
  /** Static geometry drawn at the origin; the wrapper <g> is what translates. */
  children: React.ReactNode;
}

/**
 * The complete translate-shaped hover follower: an always-mounted <g> that
 * springs to (x, y) under the seeded protocol (jump on first show, glide
 * after, reset on hide) and hides via CSS opacity so the spring persists and
 * re-hover glides. Render it UNCONDITIONALLY inside the plot group with
 * static children at the origin — "add a hover highlight to chart X" is this
 * plus a nullable hover index. Followers whose spring drives something other
 * than a translate (arc-length dots, the highlight band's clip rect) use
 * useSeededAim directly instead.
 */
export function FadeFollower({
  x,
  y = 0,
  visible,
  config = springPresets.crosshair,
  fadeMs = 120,
  children,
}: FadeFollowerProps) {
  const follow = useTranslate(config);
  useSeededAim(visible, [x, y], (first) => {
    if (first) follow.jump(x, y);
    else follow.to(x, y);
  });

  return (
    <g
      ref={follow.bind}
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${fadeMs}ms ease`,
      }}
    >
      {children}
    </g>
  );
}
