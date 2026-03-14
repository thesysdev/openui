import React from "react";
import { View, Text as RNText, StyleSheet } from "react-native";
import { defineComponent, createLibrary } from "@openuidev/react-lang";
import { z } from "zod";
import Svg, {
  Rect,
  Polyline,
  Path,
  Circle,
  Text as SVGText,
  G,
  Line,
} from "react-native-svg";

// ─── Shared chart constants ───────────────────────────────────────────────────

const CHART_W = 320;
const CHART_H = 180;
const AXIS_L = 32;
const AXIS_B = 28;
const PLOT_W = CHART_W - AXIS_L;
const PLOT_H = CHART_H - AXIS_B;

const PIE_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
];

const DataPointSchema = z.object({
  label: z.string().describe("X-axis or slice label"),
  value: z.number().describe("Numeric value"),
});

// ─── Text ────────────────────────────────────────────────────────────────────

const TextComponent = defineComponent({
  name: "Text",
  description: "Renders a line of text. Use variant to control emphasis.",
  props: z.object({
    content: z.string().describe("The text to display"),
    variant: z
      .enum(["body", "heading", "caption"])
      .optional()
      .describe("Visual style of the text"),
  }),
  component: ({ props }) => {
    const { content, variant = "body" } = props;
    const style =
      variant === "heading"
        ? styles.textHeading
        : variant === "caption"
          ? styles.textCaption
          : styles.textBody;
    return <RNText style={style}>{content}</RNText>;
  },
});

// ─── BarChart ─────────────────────────────────────────────────────────────────

const BarChartComponent = defineComponent({
  name: "BarChart",
  description:
    "Renders a vertical bar chart for comparing discrete values across categories.",
  props: z.object({
    data: z
      .array(DataPointSchema)
      .describe("Array of { label, value } data points"),
    title: z.string().optional().describe("Chart title displayed above the bars"),
    color: z
      .string()
      .optional()
      .describe("Hex color for bars, e.g. \"#6366f1\". Defaults to indigo."),
  }),
  component: ({ props }) => {
    const { data, title, color = "#6366f1" } = props;
    const validData = (data ?? []).filter(
      (d) => d != null && d.value != null && !isNaN(Number(d.value)),
    );
    if (validData.length === 0) return null;

    const max = Math.max(...validData.map((d) => Number(d.value)));
    const barW = PLOT_W / validData.length;
    const pad = barW * 0.2;

    return (
      <View style={styles.chartContainer}>
        {title ? <RNText style={styles.chartTitle}>{title}</RNText> : null}
        <Svg width={CHART_W} height={CHART_H}>
          <Line
            x1={AXIS_L}
            y1={0}
            x2={AXIS_L}
            y2={PLOT_H}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
          <Line
            x1={AXIS_L}
            y1={PLOT_H}
            x2={CHART_W}
            y2={PLOT_H}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
          {validData.map((d, i) => {
            const v = Number(d.value);
            const barH = max > 0 ? (v / max) * PLOT_H : 0;
            const x = AXIS_L + i * barW + pad;
            const y = PLOT_H - barH;
            const w = barW - pad * 2;
            const midX = AXIS_L + i * barW + barW / 2;
            return (
              <G key={i}>
                <Rect x={x} y={y} width={w} height={barH} fill={color} rx={3} />
                <SVGText
                  x={midX}
                  y={CHART_H - 6}
                  fontSize={9}
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  {d.label}
                </SVGText>
                <SVGText
                  x={midX}
                  y={y - 3}
                  fontSize={9}
                  fill="#374151"
                  textAnchor="middle"
                >
                  {v}
                </SVGText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  },
});

// ─── LineChart ────────────────────────────────────────────────────────────────

const LineChartComponent = defineComponent({
  name: "LineChart",
  description:
    "Renders a line chart to visualise trends across an ordered sequence of values.",
  props: z.object({
    data: z
      .array(DataPointSchema)
      .describe("Ordered array of { label, value } data points"),
    title: z.string().optional().describe("Chart title"),
    color: z
      .string()
      .optional()
      .describe("Hex color for the line, e.g. \"#10b981\". Defaults to emerald."),
  }),
  component: ({ props }) => {
    const { data, title, color = "#10b981" } = props;
    const validData = (data ?? []).filter(
      (d) => d != null && d.value != null && !isNaN(Number(d.value)),
    );
    if (validData.length === 0) return null;

    const max = Math.max(...validData.map((d) => Number(d.value)));
    const min = Math.min(...validData.map((d) => Number(d.value)));
    const range = max - min || 1;
    const xStep = validData.length > 1 ? PLOT_W / (validData.length - 1) : 0;

    const points = validData.map((d, i) => ({
      x: AXIS_L + i * xStep,
      y: PLOT_H - ((Number(d.value) - min) / range) * PLOT_H,
      label: d.label,
    }));

    const polylineStr = points.map((p) => `${p.x},${p.y}`).join(" ");

    return (
      <View style={styles.chartContainer}>
        {title ? <RNText style={styles.chartTitle}>{title}</RNText> : null}
        <Svg width={CHART_W} height={CHART_H}>
          <Line
            x1={AXIS_L}
            y1={0}
            x2={AXIS_L}
            y2={PLOT_H}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
          <Line
            x1={AXIS_L}
            y1={PLOT_H}
            x2={CHART_W}
            y2={PLOT_H}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
          <Polyline
            points={polylineStr}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((p, i) => (
            <G key={i}>
              <Circle cx={p.x} cy={p.y} r={3} fill={color} />
              <SVGText
                x={p.x}
                y={CHART_H - 6}
                fontSize={9}
                fill="#6b7280"
                textAnchor="middle"
              >
                {p.label}
              </SVGText>
            </G>
          ))}
        </Svg>
      </View>
    );
  },
});

// ─── PieChart ─────────────────────────────────────────────────────────────────

const PieChartComponent = defineComponent({
  name: "PieChart",
  description: "Renders a pie chart to show how parts contribute to a whole.",
  props: z.object({
    data: z
      .array(
        z.object({
          label: z.string().describe("Slice label shown in the legend"),
          value: z.number().describe("Numeric value for this slice"),
          color: z
            .string()
            .optional()
            .describe("Hex color override for this slice"),
        }),
      )
      .describe("Array of { label, value, color? } slices"),
    title: z.string().optional().describe("Chart title"),
  }),
  component: ({ props }) => {
    const { data, title } = props;
    const validData = (data ?? []).filter(
      (d) => d != null && d.value != null && !isNaN(Number(d.value)),
    );
    if (validData.length === 0) return null;

    const total = validData.reduce((s, d) => s + Number(d.value), 0);
    const CX = 75;
    const CY = 75;
    const R = 65;

    let angle = -Math.PI / 2;
    const slices = validData.map((d, i) => {
      const sweep = (Number(d.value) / total) * 2 * Math.PI;
      const end = angle + sweep;
      const x1 = CX + R * Math.cos(angle);
      const y1 = CY + R * Math.sin(angle);
      const x2 = CX + R * Math.cos(end);
      const y2 = CY + R * Math.sin(end);
      const large = sweep > Math.PI ? 1 : 0;
      const path = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
      const sliceColor = d.color ?? PIE_COLORS[i % PIE_COLORS.length];
      angle = end;
      return { path, color: sliceColor, label: d.label, value: Number(d.value) };
    });

    return (
      <View style={styles.chartContainer}>
        {title ? <RNText style={styles.chartTitle}>{title}</RNText> : null}
        <View style={styles.pieRow}>
          <Svg width={150} height={150}>
            {slices.map((s, i) => (
              <Path
                key={i}
                d={s.path}
                fill={s.color}
                stroke="#fff"
                strokeWidth={1.5}
              />
            ))}
          </Svg>
          <View style={styles.pieLegend}>
            {slices.map((s, i) => {
              const pct =
                total > 0 ? Math.round((Number(validData[i].value) / total) * 100) : 0;
              return (
                <View key={i} style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: s.color }]}
                  />
                  <RNText style={styles.legendLabel} numberOfLines={1}>
                    {s.label}
                  </RNText>
                  <RNText style={styles.legendPct}>{pct}%</RNText>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  },
});

// ─── Card ────────────────────────────────────────────────────────────────────

const CardComponent = defineComponent({
  name: "Card",
  description:
    "A container card that holds a list of child components.",
  props: z.object({
    children: z
      .array(
        z.union([
          TextComponent.ref,
          BarChartComponent.ref,
          LineChartComponent.ref,
          PieChartComponent.ref,
        ]),
      )
      .optional()
      .describe("Child components rendered inside the card"),
  }),
  component: ({ props, renderNode }) => {
    const { children } = props;
    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          {Array.isArray(children)
            ? children.map((child, i) => (
                <View key={i}>{renderNode(child)}</View>
              ))
            : null}
        </View>
      </View>
    );
  },
});

// ─── Library ─────────────────────────────────────────────────────────────────

export const library = createLibrary({
  components: [
    TextComponent,
    BarChartComponent,
    LineChartComponent,
    PieChartComponent,
    CardComponent,
  ],
  root: "Card",
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    alignSelf: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  cardBody: {
    gap: 6,
    alignSelf: "stretch",
  },
  textHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  textBody: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  textCaption: {
    fontSize: 12,
    color: "#9ca3af",
  },
  chartContainer: {
    alignSelf: "stretch",
    paddingVertical: 4,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  pieRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pieLegend: {
    flex: 1,
    gap: 6,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: 11,
    color: "#374151",
  },
  legendPct: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
  },
});
