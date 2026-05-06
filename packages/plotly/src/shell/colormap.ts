// Map LLM-friendly colormap names onto Plotly colorscale arrays.
// Plotly accepts a string ("Viridis", "RdBu", …) for built-ins; we lower-case
// and translate so the LLM can write `colormap: "viridis"` and we hand Plotly
// what it actually wants. We also accept arbitrary strings that Plotly knows
// natively, falling back to the value verbatim.

import type { ColorScale } from "plotly.js";

// Sequential and diverging colormaps Plotly ships natively.
const NATIVE_NAME_MAP: Record<string, string> = {
  // sequential — perceptually uniform
  viridis: "Viridis",
  inferno: "Inferno",
  plasma: "Plasma",
  magma: "Magma",
  cividis: "Cividis",
  turbo: "Turbo",

  // sequential — branded
  blues: "Blues",
  greens: "Greens",
  oranges: "Oranges",
  purples: "Purples",
  greys: "Greys",
  reds: "Reds",
  ylorrd: "YlOrRd",
  ylgnbu: "YlGnBu",

  // diverging
  rdbu: "RdBu",
  brbg: "BrBG",
  piyg: "PiYG",
  spectral: "Spectral",
  rdylgn: "RdYlGn",
  rdylbu: "RdYlBu",
};

const DIVERGING = new Set(["rdbu", "brbg", "piyg", "spectral", "rdylgn", "rdylbu"]);

export function resolveColormap(name?: string): string | ColorScale | undefined {
  if (!name) return undefined;
  const key = name.toLowerCase();
  return NATIVE_NAME_MAP[key] ?? name;
}

export function isDivergingColormap(name?: string): boolean {
  if (!name) return false;
  return DIVERGING.has(name.toLowerCase());
}
