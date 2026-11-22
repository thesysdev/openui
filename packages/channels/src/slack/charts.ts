/**
 * Native Slack charts: ChartSpec -> a `data_visualization` Block Kit block.
 *
 * Documented constraints (docs.slack.dev/reference/block-kit/blocks/data-visualization-block):
 *   - title required, <=50 chars; block types: pie | bar | line | area
 *   - pie: 1-12 segments, every value > 0
 *   - bar/line/area: 1-12 series, 1-20 points each, every point's label must
 *     match an axis_config.categories entry; labels and series names <=20 chars
 *   - at most 2 data_visualization blocks per message (extras are downgraded to
 *     rasterized images by the channel's finalize + the transport)
 */
import type { ChartSpec } from "../ui/types";
import type { SlackBlock } from "./types";

const NATIVE_CHART_TYPES = new Set(["pie", "bar", "line", "area"]);

/** The placeholder image URL transports recognize as "rasterize this chart". */
export const CHART_PLACEHOLDER_URL = "https://placehold.co/1x1.png";

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/**
 * Clip labels to 20 chars and de-duplicate: categories are looked up by label,
 * so two points truncating to the same string would collide.
 */
function chartLabels(raw: string[]): string[] {
  const used = new Set<string>();
  return raw.map((r) => {
    let label = clip(r || "·", 20);
    for (let i = 2; used.has(label); i++) label = `${clip(r || "·", 20 - `~${i}`.length)}~${i}`;
    used.add(label);
    return label;
  });
}

/** True for a native chart block. */
export const isChartBlock = (b: SlackBlock | undefined): boolean =>
  b?.type === "data_visualization";

/** True for a chart placeholder image block (a chart awaiting rasterize-and-upload). */
export const isChartPlaceholder = (b: SlackBlock | undefined): boolean =>
  b?.type === "image" && b.image_url === CHART_PLACEHOLDER_URL && !!b.block_id;

/** The placeholder image block a transport swaps for an uploaded chart PNG. */
export function chartPlaceholderBlock(id: string, alt?: string): SlackBlock {
  return {
    type: "image",
    block_id: id,
    image_url: CHART_PLACEHOLDER_URL,
    alt_text: alt || "chart",
  };
}

/**
 * Build the native block for one chart, applying every documented cap. Returns
 * null when the spec has no renderable data (the chart is then dropped).
 */
export function chartBlock(spec: ChartSpec): SlackBlock | null {
  const points = (spec.labels ?? [])
    .map((label, i) => ({ label: String(label ?? ""), value: Number(spec.values?.[i]) }))
    .filter((p) => Number.isFinite(p.value))
    .slice(0, 20);
  const title = clip(spec.title || spec.series || "Chart", 50);
  let type = NATIVE_CHART_TYPES.has(spec.type) ? spec.type : "bar";

  if (type === "pie") {
    const segments = points.filter((p) => p.value > 0).slice(0, 12);
    if (segments.length) {
      const labels = chartLabels(segments.map((p) => p.label));
      return {
        type: "data_visualization",
        block_id: spec.id,
        title,
        chart: {
          type: "pie",
          segments: segments.map((p, i) => ({ label: labels[i], value: p.value })),
        },
      };
    }
    type = "bar"; // pie segments must be > 0; a bar chart can still show these values
  }

  if (!points.length) return null;
  const labels = chartLabels(points.map((p) => p.label));
  return {
    type: "data_visualization",
    block_id: spec.id,
    title,
    chart: {
      type,
      series: [
        {
          name: clip(spec.series || title, 20),
          data: points.map((p, i) => ({ label: labels[i], value: p.value })),
        },
      ],
      axis_config: {
        categories: labels,
        ...(spec.xLabel ? { x_label: clip(spec.xLabel, 50) } : {}),
        ...(spec.yLabel ? { y_label: clip(spec.yLabel, 50) } : {}),
      },
    },
  };
}
