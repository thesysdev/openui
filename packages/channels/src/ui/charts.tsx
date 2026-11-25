/**
 * Renders a chart to a PNG. recharts draws at a fixed size to a static SVG, which
 * resvg rasterizes. recharts' <Legend> renders as HTML rather than SVG, so the
 * legend is drawn into the SVG here instead.
 */
import { Resvg } from "@resvg/resvg-js";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartSpec } from "./types";

const COLORS = ["#4A90D9", "#50C878", "#F5A623", "#E0533D", "#9B59B6", "#1ABC9C"];
const FONT = "Helvetica, Arial, Liberation Sans, DejaVu Sans, sans-serif";
// Small logical canvas, rasterized at 2x: chat apps show images ~300px wide, so text stays legible.
const WIDTH = 420;
const HEIGHT = 260;
const SCALE = 2;
const TEXT_SIZE = 16;

/** Colors for the chart background, text, and grid. */
export type ChartTheme = "light" | "dark";
export type ChartRenderOptions = { theme?: ChartTheme };

const THEMES = {
  light: { background: "white", text: "#666", legend: "#333", grid: "#ccc" },
  dark: { background: "#111b21", text: "#aebac1", legend: "#e9edef", grid: "#2a3942" },
} as const;
type Palette = (typeof THEMES)[ChartTheme];

type LegendEntry = { color: string; text: string };

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const decimal = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
const formatValue = (v: unknown) => {
  const n = Number(v);
  if (Math.abs(n) >= 1000) return compact.format(n);
  return Math.abs(n) >= 1 || n === 0 ? decimal.format(n) : String(Number(n.toPrecision(2)));
};
/** Rough rendered width of a label at TEXT_SIZE, for layout without a DOM to measure. */
const textWidth = (t: string) => t.length * TEXT_SIZE * 0.6;

/** The recharts element for a spec (without <Legend>; that is injected later). */
function ChartElement({ spec, theme }: { spec: ChartSpec; theme: Palette }) {
  const data = spec.labels.map((name, i) => ({ name, v: Number(spec.values[i] ?? 0) }));
  const seriesName = spec.series || spec.title || "Value";

  if (spec.type === "pie") {
    return (
      <PieChart width={WIDTH} height={HEIGHT}>
        <Pie
          data={data}
          dataKey="v"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          isAnimationActive={false}
          stroke={theme.background}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    );
  }

  const maxAbs = Math.max(0, ...data.map((d) => Math.abs(d.v)));
  const yWidth = Math.ceil(textWidth(formatValue(maxAbs * 1.25)) + 14);
  // Line and area charts put the last label on the right edge; leave room for half of it, capped so a long label cannot squeeze the plot.
  const edgeLabel =
    spec.type === "line" || spec.type === "area" ? data[data.length - 1] : undefined;
  const edgeRoom = edgeLabel ? Math.ceil(textWidth(String(edgeLabel.name)) / 2) + 4 : 0;
  const right = Math.min(48, Math.max(16, edgeRoom));
  const margin = { top: 26, right, left: 0, bottom: spec.xLabel ? 24 : 8 };
  // Static rendering can't measure ticks, so thin out X labels that would overlap.
  const plotWidth = WIDTH - margin.left - margin.right - yWidth;
  const labelWidth = Math.max(...data.map((d) => textWidth(String(d.name)))) + 10;
  const fit = Math.max(1, Math.floor(plotWidth / labelWidth));
  const xInterval = Math.max(0, Math.ceil(data.length / fit) - 1);

  // Kept as a flat array, not a Fragment: recharts only scans direct children.
  const axes = [
    <CartesianGrid key="grid" strokeDasharray="3 3" stroke={theme.grid} />,
    <XAxis
      key="x"
      dataKey="name"
      interval={xInterval}
      stroke={theme.grid}
      tick={{ fill: theme.text, fontFamily: FONT, fontSize: TEXT_SIZE }}
      label={spec.xLabel ? { value: spec.xLabel, position: "insideBottom", offset: -6 } : undefined}
    />,
    <YAxis
      key="y"
      allowDecimals={false}
      width={yWidth}
      tickFormatter={formatValue}
      stroke={theme.grid}
      tick={{ fill: theme.text, fontFamily: FONT, fontSize: TEXT_SIZE }}
      label={spec.yLabel ? { value: spec.yLabel, angle: -90, position: "insideLeft" } : undefined}
    />,
  ];
  const valueLabels = (
    <LabelList
      dataKey="v"
      position="top"
      fill={theme.legend}
      fontFamily={FONT}
      fontSize={TEXT_SIZE}
      fontWeight={600}
      formatter={formatValue}
    />
  );

  if (spec.type === "line") {
    return (
      <LineChart width={WIDTH} height={HEIGHT} data={data} margin={margin}>
        {axes}
        <Line dataKey="v" name={seriesName} stroke={COLORS[0]} dot isAnimationActive={false}>
          {valueLabels}
        </Line>
      </LineChart>
    );
  }
  if (spec.type === "area") {
    return (
      <AreaChart width={WIDTH} height={HEIGHT} data={data} margin={margin}>
        {axes}
        <Area
          dataKey="v"
          name={seriesName}
          stroke={COLORS[0]}
          fill={COLORS[0]}
          fillOpacity={0.3}
          isAnimationActive={false}
        >
          {valueLabels}
        </Area>
      </AreaChart>
    );
  }
  return (
    <BarChart width={WIDTH} height={HEIGHT} data={data} margin={margin}>
      {axes}
      <Bar dataKey="v" name={seriesName} fill={COLORS[0]} isAnimationActive={false}>
        {valueLabels}
      </Bar>
    </BarChart>
  );
}

/** One legend entry per slice (with its value) for pie charts; a single series entry otherwise. */
function legendEntries(spec: ChartSpec): LegendEntry[] {
  if (spec.type === "pie") {
    return spec.labels.map((label, i) => ({
      text: `${label}: ${formatValue(spec.values[i] ?? 0)}`,
      color: COLORS[i % COLORS.length],
    }));
  }
  return [{ text: spec.series || spec.title || "Value", color: COLORS[0] }];
}

const escapeXml = (s: string) =>
  s.replace(/[<>&]/g, (c) => (c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;"));

/** Append a wrapping legend row below the chart, expanding the SVG height to fit. */
function injectLegend(svg: string, entries: LegendEntry[], color: string): string {
  if (!entries.length) return svg;
  const width = Number(svg.match(/width="(\d+)"/)?.[1] ?? WIDTH);
  const height = Number(svg.match(/height="(\d+)"/)?.[1] ?? HEIGHT);
  const rowH = 24;
  const swatch = 12;
  const entryWidth = (t: string) => swatch + 6 + t.length * 8.5 + 18;

  const rows: LegendEntry[][] = [[]];
  let cursor = 12;
  for (const entry of entries) {
    const w = entryWidth(entry.text);
    if (cursor + w > width - 12 && rows[rows.length - 1].length) {
      rows.push([]);
      cursor = 12;
    }
    rows[rows.length - 1].push(entry);
    cursor += w;
  }

  let items = "";
  rows.forEach((row, r) => {
    let x = 12;
    const y = height + 8 + r * rowH;
    for (const entry of row) {
      items += `<rect x="${x}" y="${y}" width="${swatch}" height="${swatch}" rx="2" fill="${entry.color}"/>`;
      items += `<text x="${x + swatch + 6}" y="${y + swatch - 1}" font-family="${FONT}" font-size="${TEXT_SIZE - 1}" fill="${color}">${escapeXml(entry.text)}</text>`;
      x += entryWidth(entry.text);
    }
  });

  const newHeight = height + rows.length * rowH + 10;
  return svg
    .replace(/height="\d+"/, `height="${newHeight}"`)
    .replace(/viewBox="0 0 \d+ \d+"/, `viewBox="0 0 ${width} ${newHeight}"`)
    .replace("</svg>", `${items}</svg>`);
}

/**
 * Render a chart spec to a PNG buffer, complete with axes, value labels, and a legend.
 * Pass `{ theme: "dark" }` for a dark background that sits well in dark-mode chat apps.
 */
export function renderChartPng(spec: ChartSpec, options: ChartRenderOptions = {}): Buffer {
  const theme = THEMES[options.theme ?? "light"];
  const html = renderToStaticMarkup(<ChartElement spec={spec} theme={theme} />);
  const match = html.match(/<svg[\s\S]*<\/svg>/);
  if (!match) throw new Error("chart produced no <svg>");
  let svg = match[0];
  if (!/xmlns=/.test(svg)) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  svg = injectLegend(svg, legendEntries(spec), theme.legend);
  return Buffer.from(
    new Resvg(svg, { background: theme.background, fitTo: { mode: "zoom", value: SCALE } })
      .render()
      .asPng(),
  );
}

export type { ChartSpec } from "./types";
