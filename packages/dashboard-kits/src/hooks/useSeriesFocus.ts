import { useState } from "react";

/** Opacity of a series' marks while another series has focus. */
export const FADED_OPACITY = 0.16;

/**
 * Which series a chart brings forward. Hovering a legend item focuses its series
 * for as long as the pointer stays; clicking pins it until clicked again.
 */
export function useSeriesFocus() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const active = hovered ?? pinned;
  return {
    active,
    opacity: (name: string) => (active == null || active === name ? 1 : FADED_OPACITY),
    legend: {
      active,
      pinned,
      onHover: setHovered,
      onToggle: (name: string) => setPinned((p) => (p === name ? null : name)),
    },
  };
}
