import { defineFunction } from "@openuidev/react-lang";
import { z } from "zod/v4";

const HEX = /^#?([\da-f]{3}|[\da-f]{6})$/i;

function channels(color: string): number[] {
  const m = HEX.exec(color.trim());
  if (!m) throw new Error(`not a hex color: ${color}`);
  const hex = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

export const MixColor = defineFunction({
  name: "MixColor",
  description: 'The hex color a fraction t of the way from one hex color to another, e.g. @MixColor("#ffffff", "#0285ff", 0.5) for a heatmap or a tint',
  params: z.object({ from: z.string(), to: z.string(), t: z.number() }),
  returns: z.string(),
  fn: ({ from, to, t }) => {
    const a = channels(from);
    const b = channels(to);
    const k = Math.min(1, Math.max(0, t));
    return `#${a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
  },
});

export const colorFunctions = [MixColor];
