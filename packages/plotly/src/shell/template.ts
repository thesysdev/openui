// OpenUI-flavored Plotly templates. Light and dark variants. Merged into every
// chart's `layout` so the LLM never has to author chart styling — only data.

import type { Layout } from "plotly.js";

const SYSTEM_FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const OPENUI_PALETTE = [
  "#4c78a8",
  "#f58518",
  "#54a24b",
  "#e45756",
  "#72b7b2",
  "#eeca3b",
  "#b279a2",
  "#ff9da6",
  "#9d755d",
  "#bab0ac",
  "#5b8ff9",
  "#a3a637",
];

export const lightTemplate: Partial<Layout> = {
  font: { family: SYSTEM_FONT_STACK, size: 12, color: "#0f172a" },
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  margin: { t: 16, r: 16, b: 40, l: 56, pad: 0 },
  colorway: OPENUI_PALETTE,
  xaxis: {
    gridcolor: "rgba(15,23,42,0.06)",
    linecolor: "rgba(15,23,42,0.18)",
    tickcolor: "rgba(15,23,42,0.18)",
    tickfont: { size: 10.5, color: "rgba(15,23,42,0.6)" },
    title: { font: { size: 12, color: "rgba(15,23,42,0.8)" } },
    zeroline: false,
    automargin: true,
  },
  yaxis: {
    gridcolor: "rgba(15,23,42,0.06)",
    linecolor: "rgba(15,23,42,0.18)",
    tickcolor: "rgba(15,23,42,0.18)",
    tickfont: { size: 10.5, color: "rgba(15,23,42,0.6)" },
    title: { font: { size: 12, color: "rgba(15,23,42,0.8)" } },
    zeroline: false,
    automargin: true,
  },
  legend: {
    font: { size: 11, color: "rgba(15,23,42,0.85)" },
    bgcolor: "transparent",
    bordercolor: "rgba(15,23,42,0.10)",
    borderwidth: 0,
  },
  hoverlabel: {
    bgcolor: "white",
    bordercolor: "rgba(15,23,42,0.12)",
    font: { family: SYSTEM_FONT_STACK, size: 12, color: "#0f172a" },
    align: "left",
  },
  title: {
    font: { family: SYSTEM_FONT_STACK, size: 14, color: "#0f172a" },
    x: 0,
    xanchor: "left",
    pad: { l: 0, t: 0, r: 0, b: 8 },
  },
  transition: { duration: 220, easing: "cubic-in-out" },
  modebar: {
    bgcolor: "transparent",
    color: "rgba(15,23,42,0.45)",
    activecolor: "rgba(15,23,42,0.85)",
  },
};

// Dark template — same shape, swap surface and ink.
export const darkTemplate: Partial<Layout> = {
  ...lightTemplate,
  font: { family: SYSTEM_FONT_STACK, size: 12, color: "#e2e8f0" },
  xaxis: {
    ...lightTemplate.xaxis,
    gridcolor: "rgba(226,232,240,0.07)",
    linecolor: "rgba(226,232,240,0.22)",
    tickcolor: "rgba(226,232,240,0.22)",
    tickfont: { size: 10.5, color: "rgba(226,232,240,0.6)" },
    title: { font: { size: 12, color: "rgba(226,232,240,0.8)" } },
  },
  yaxis: {
    ...lightTemplate.yaxis,
    gridcolor: "rgba(226,232,240,0.07)",
    linecolor: "rgba(226,232,240,0.22)",
    tickcolor: "rgba(226,232,240,0.22)",
    tickfont: { size: 10.5, color: "rgba(226,232,240,0.6)" },
    title: { font: { size: 12, color: "rgba(226,232,240,0.8)" } },
  },
  hoverlabel: {
    bgcolor: "#0f172a",
    bordercolor: "rgba(226,232,240,0.18)",
    font: { family: SYSTEM_FONT_STACK, size: 12, color: "#e2e8f0" },
    align: "left",
  },
};

import type { Config } from "plotly.js";

export const defaultConfig: Partial<Config> = {
  displayModeBar: false,
  displaylogo: false,
  responsive: true,
  doubleClick: "reset",
  scrollZoom: false,
};
