"use client";
import { defineComponent, useRenderNode } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";

const FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Stack ---------------------------------------------------------------------

const StackSchema = z.object({
  children: z.array(z.unknown()),
  direction: z.enum(["row", "column"]).optional(),
  gap: z.number().optional(),
  wrap: z.boolean().optional(),
});

export const Stack = defineComponent({
  name: "Stack",
  props: StackSchema,
  description:
    "Flex container. `direction='column'` (default) or 'row'. `gap` in px, `wrap=true` to wrap rows. Wrap charts and Cards as children.",
  component: ({ props }) => {
    const renderNode = useRenderNode();
    const direction = props.direction ?? "column";
    return (
      <div
        style={{
          display: "flex",
          flexDirection: direction,
          gap: props.gap ?? (direction === "row" ? 12 : 14),
          flexWrap: props.wrap ? "wrap" : "nowrap",
          width: "100%",
        }}
      >
        {(props.children ?? []).map((c, i) => (
          <div
            key={i}
            style={{ flex: direction === "row" && !props.wrap ? "1 1 0" : undefined, minWidth: 0 }}
          >
            {renderNode(c)}
          </div>
        ))}
      </div>
    );
  },
});

// Card ----------------------------------------------------------------------

const CardSchema = z.object({ children: z.array(z.unknown()) });

export const Card = defineComponent({
  name: "Card",
  props: CardSchema,
  description:
    "Surface that wraps related content (e.g. CardHeader + a chart). Pass children as an array.",
  component: ({ props }) => {
    const renderNode = useRenderNode();
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(15,23,42,0.10)",
          borderRadius: 12,
          padding: 14,
          boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)",
          fontFamily: FONT,
          color: "#0f172a",
          transition: "box-shadow 240ms ease, border-color 240ms ease",
        }}
      >
        {(props.children ?? []).map((c, i) => (
          <React.Fragment key={i}>{renderNode(c)}</React.Fragment>
        ))}
      </div>
    );
  },
});

// CardHeader ----------------------------------------------------------------

const CardHeaderSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
});

export const CardHeader = defineComponent({
  name: "CardHeader",
  props: CardHeaderSchema,
  description: "Header for a Card: title and optional subtitle.",
  component: ({ props }) => (
    <div style={{ marginBottom: 10, fontFamily: FONT }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.25 }}>
        {props.title}
      </div>
      {props.subtitle && (
        <div style={{ fontSize: 12, color: "rgba(15,23,42,0.6)", marginTop: 2, lineHeight: 1.3 }}>
          {props.subtitle}
        </div>
      )}
    </div>
  ),
});

// Heading -------------------------------------------------------------------

const HeadingSchema = z.object({
  text: z.string(),
  level: z.enum(["h1", "h2", "h3"]).optional(),
});

const HEADING_SIZES = {
  h1: { fontSize: 22, fontWeight: 700, lineHeight: 1.2 },
  h2: { fontSize: 17, fontWeight: 600, lineHeight: 1.3 },
  h3: { fontSize: 14, fontWeight: 600, lineHeight: 1.35 },
};

export const Heading = defineComponent({
  name: "Heading",
  props: HeadingSchema,
  description:
    "Heading. `level`: 'h1' (default), 'h2', 'h3'. Use 'h1' for dashboard titles, 'h2' for section titles.",
  component: ({ props }) => {
    const s = HEADING_SIZES[props.level ?? "h1"];
    return (
      <div style={{ ...s, color: "#0f172a", fontFamily: FONT, fontVariantNumeric: "tabular-nums" }}>
        {props.text}
      </div>
    );
  },
});

// Text ----------------------------------------------------------------------

const TextSchema = z.object({
  text: z.string(),
  color: z.string().optional(),
});

export const Text = defineComponent({
  name: "Text",
  props: TextSchema,
  description: "Paragraph of analysis prose. Use newlines for line breaks.",
  component: ({ props }) => (
    <div
      style={{
        fontSize: 13,
        color: props.color ?? "#0f172a",
        lineHeight: 1.55,
        fontFamily: FONT,
        whiteSpace: "pre-wrap",
      }}
    >
      {props.text}
    </div>
  ),
});

// Callout -------------------------------------------------------------------

const CalloutSchema = z.object({
  variant: z.enum(["info", "success", "warning", "error"]).optional(),
  title: z.string().optional(),
  body: z.string(),
});

const CALLOUT_COLORS = {
  info: { bg: "rgba(59,130,246,0.08)", border: "#3b82f6", icon: "i" },
  success: { bg: "rgba(34,197,94,0.08)", border: "#22c55e", icon: "✓" },
  warning: { bg: "rgba(234,179,8,0.10)", border: "#eab308", icon: "!" },
  error: { bg: "rgba(239,68,68,0.08)", border: "#ef4444", icon: "✕" },
};

export const Callout = defineComponent({
  name: "Callout",
  props: CalloutSchema,
  description:
    "Highlight a finding next to a chart. `variant`: 'info' | 'success' | 'warning' | 'error'. Use to flag effect sizes, p-values, anomalies.",
  component: ({ props }) => {
    const v = props.variant ?? "info";
    const c = CALLOUT_COLORS[v];
    return (
      <div
        style={{
          background: c.bg,
          borderLeft: `3px solid ${c.border}`,
          borderRadius: 6,
          padding: "10px 12px",
          fontFamily: FONT,
          color: "#0f172a",
          fontSize: 13,
          lineHeight: 1.5,
          display: "flex",
          gap: 10,
        }}
      >
        <span style={{ color: c.border, fontWeight: 700 }}>{c.icon}</span>
        <div>
          {props.title && <div style={{ fontWeight: 600, marginBottom: 2 }}>{props.title}</div>}
          <div style={{ color: "rgba(15,23,42,0.65)" }}>{props.body}</div>
        </div>
      </div>
    );
  },
});

// KPI -----------------------------------------------------------------------

const KPISchema = z.object({
  label: z.string(),
  value: z.string(),
  change: z.string().optional(),
  changeDirection: z.enum(["up", "down", "flat"]).optional(),
});

export const KPI = defineComponent({
  name: "KPI",
  props: KPISchema,
  description:
    "Single big-number metric. `value` should already be formatted (e.g. '$1.26M'). Optional `change` (e.g. '+12.4%') with direction for up/down/flat coloring.",
  component: ({ props }) => {
    const dir = props.changeDirection ?? "flat";
    const color = dir === "up" ? "#16a34a" : dir === "down" ? "#dc2626" : "rgba(15,23,42,0.55)";
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(15,23,42,0.10)",
          borderRadius: 12,
          padding: 14,
          fontFamily: FONT,
        }}
      >
        <div style={{ fontSize: 12, color: "rgba(15,23,42,0.6)", fontWeight: 500 }}>
          {props.label}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#0f172a",
            fontVariantNumeric: "tabular-nums",
            marginTop: 4,
            lineHeight: 1.1,
          }}
        >
          {props.value}
        </div>
        {props.change && (
          <div
            style={{
              fontSize: 12,
              color,
              marginTop: 4,
              fontVariantNumeric: "tabular-nums",
              fontWeight: 500,
            }}
          >
            {dir === "up" ? "↑" : dir === "down" ? "↓" : "→"} {props.change}
          </div>
        )}
      </div>
    );
  },
});
