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
const WIDTH = 560;
const HEIGHT = 320;

type LegendEntry = { color: string; text: string };

/** The recharts element for a spec (without <Legend>; that is injected later). */
function ChartElement({ spec }: { spec: ChartSpec }) {
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
          outerRadius={120}
          isAnimationActive={false}
          label={(p: any) => `${p.name}: ${p.value}`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    );
  }

  // Kept as a flat array, not a Fragment: recharts only scans direct children.
  const axes = [
    <CartesianGrid key="grid" strokeDasharray="3 3" />,
    <XAxis
      key="x"
      dataKey="name"
      label={spec.xLabel ? { value: spec.xLabel, position: "insideBottom", offset: -6 } : undefined}
    />,
    <YAxis
      key="y"
      allowDecimals={false}
      label={spec.yLabel ? { value: spec.yLabel, angle: -90, position: "insideLeft" } : undefined}
    />,
  ];
  const valueLabels = <LabelList dataKey="v" position="top" />;
  const margin = { top: 24, right: 24, left: 16, bottom: spec.xLabel ? 24 : 8 };

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

/** One legend entry per slice for pie charts; a single series entry otherwise. */
function legendEntries(spec: ChartSpec): LegendEntry[] {
  if (spec.type === "pie") {
    return spec.labels.map((text, i) => ({ text, color: COLORS[i % COLORS.length] }));
  }
  return [{ text: spec.series || spec.title || "Value", color: COLORS[0] }];
}

const escapeXml = (s: string) =>
  s.replace(/[<>&]/g, (c) => (c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;"));

/** Append a wrapping legend row below the chart, expanding the SVG height to fit. */
function injectLegend(svg: string, entries: LegendEntry[]): string {
  if (!entries.length) return svg;
  const width = Number(svg.match(/width="(\d+)"/)?.[1] ?? WIDTH);
  const height = Number(svg.match(/height="(\d+)"/)?.[1] ?? HEIGHT);
  const rowH = 22;
  const swatch = 12;
  const entryWidth = (t: string) => swatch + 6 + t.length * 7 + 18;

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
      items += `<text x="${x + swatch + 6}" y="${y + swatch - 1}" font-family="sans-serif" font-size="13" fill="#333">${escapeXml(entry.text)}</text>`;
      x += entryWidth(entry.text);
    }
  });

  const newHeight = height + rows.length * rowH + 10;
  return svg
    .replace(/height="\d+"/, `height="${newHeight}"`)
    .replace(/viewBox="0 0 \d+ \d+"/, `viewBox="0 0 ${width} ${newHeight}"`)
    .replace("</svg>", `${items}</svg>`);
}

/** Render a chart spec to a PNG buffer, complete with axes, value labels, and a legend. */
export function renderChartPng(spec: ChartSpec): Buffer {
  const html = renderToStaticMarkup(<ChartElement spec={spec} />);
  const match = html.match(/<svg[\s\S]*<\/svg>/);
  if (!match) throw new Error("chart produced no <svg>");
  let svg = match[0];
  if (!/xmlns=/.test(svg)) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  svg = injectLegend(svg, legendEntries(spec));
  return Buffer.from(new Resvg(svg, { background: "white" }).render().asPng());
}

export type { ChartSpec } from "./types";
