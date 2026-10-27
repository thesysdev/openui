"use client";

import { defineComponent, FormNameContext } from "@openuidev/react-lang";
import { useId, type CSSProperties } from "react";
import { z } from "zod/v4";
import { bg, children, color, onColor, cx, length, radius, radiusSchema, size, space } from "./style";

const align = z.enum(["start", "center", "end", "stretch"]);
const justify = z.enum(["start", "center", "end", "between"]);
const FLEX: Record<string, string> = { start: "flex-start", end: "flex-end", center: "center", stretch: "stretch", between: "space-between" };

type FlexProps = { gap?: number; align?: string; justify?: string; wrap?: boolean };
const flexStyle = (p: FlexProps, column = false): CSSProperties => ({
  gap: space(p.gap),
  alignItems: p.align ? FLEX[p.align] : undefined,
  justifyContent: p.justify ? FLEX[p.justify] : undefined,
  flexWrap: p.wrap ? "wrap" : undefined,
  // A centered column centers its wrapped lines too.
  textAlign: column && (p.align === "center" || p.align === "end") ? p.align : undefined,
});

export const Box = defineComponent({
  name: "Box",
  props: z.object({
    children: children.optional(),
    direction: z.enum(["row", "col"]).optional(),
    gap: z.number().optional(),
    padding: z.number().optional(),
    background: color.optional(),
    radius: radiusSchema.optional(),
    border: z.boolean().optional(),
    width: length.optional(),
    height: length.optional(),
    flex: z.number().optional(),
    align: align.optional(),
    justify: justify.optional(),
    wrap: z.boolean().optional(),
  }),
  description: "Flex container, a column by default. radius also clips the content.",
  component: ({ props, renderNode }) => {
    const row = props.direction === "row";
    return (
      <div
        className={cx("iui-box", row ? "iui-row" : "iui-col", !row && props.gap == null && "iui-flow")}
        style={{
          ...flexStyle(props, !row),
          padding: space(props.padding),
          background: bg(props.background),
          ...onColor(props.background),
          borderRadius: radius(props.radius),
          overflow: props.radius !== undefined ? "clip" : undefined,
          border: props.border ? "1px solid var(--iui-border)" : undefined,
          width: size(props.width),
          height: size(props.height),
          // null, like an omitted argument, means no flex.
          // A width in px is meant: a Row with long text beside it must not squeeze it.
          flex: props.flex != null ? `${Math.max(0, props.flex)} 1 0%` : typeof props.width === "number" ? "0 0 auto" : undefined,
        }}
      >
        {renderNode(props.children)}
      </div>
    );
  },
});

export const Row = defineComponent({
  name: "Row",
  props: z.object({
    children,
    gap: z.number().optional(),
    align: align.optional(),
    justify: justify.optional(),
    wrap: z.boolean().optional(),
  }),
  description: "Horizontal layout; items are vertically centered.",
  component: ({ props, renderNode }) => (
    <div className="iui-row" style={flexStyle(props)}>
      {renderNode(props.children)}
    </div>
  ),
});

export const Col = defineComponent({
  name: "Col",
  props: z.object({ children, gap: z.number().optional(), align: align.optional() }),
  description: "Vertical layout. Without gap it spaces blocks like an article.",
  component: ({ props, renderNode }) => (
    <div className={cx("iui-col", props.gap == null && "iui-flow")} style={flexStyle(props, true)}>
      {renderNode(props.children)}
    </div>
  ),
});

export const Grid = defineComponent({
  name: "Grid",
  props: z.object({
    children,
    columns: z.number().optional(),
    minChildWidth: z.number().optional(),
    gap: z.number().optional(),
  }),
  description: "Equal columns (default 2). With minChildWidth (px), columns drop on narrow screens.",
  component: ({ props, renderNode }) => {
    const columns = Math.min(12, Math.max(1, Math.round(props.columns ?? 2)));
    const gap = space(props.gap) ?? "12px";
    // At most `columns` columns, each at least minChildWidth wide.
    const min = props.minChildWidth ? `max(${Math.max(0, props.minChildWidth)}px, (100% - ${columns - 1} * ${gap}) / ${columns})` : null;
    return (
      <div
        className="iui-grid"
        style={{
          gap,
          gridTemplateColumns: min ? `repeat(auto-fill, minmax(min(100%, ${min}), 1fr))` : `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {renderNode(props.children)}
      </div>
    );
  },
});

export const Card = defineComponent({
  name: "Card",
  props: z.object({
    children,
    variant: z.enum(["outline", "soft"]).optional(),
    padding: z.number().optional(),
    gap: z.number().optional(),
  }),
  description: "Panel with a border; soft is a filled panel for summaries.",
  component: ({ props, renderNode }) => (
    <section
      className={cx("iui-card", props.variant === "soft" && "iui-card-soft", props.gap == null && "iui-flow")}
      style={{ padding: space(props.padding), gap: space(props.gap) }}
    >
      {renderNode(props.children)}
    </section>
  ),
});

export const Divider = defineComponent({
  name: "Divider",
  props: z.object({}),
  description: "",
  component: () => <hr className="iui-divider" />,
});

export const Spacer = defineComponent({
  name: "Spacer",
  props: z.object({}),
  description: "Fills the free space in a Row.",
  component: () => <div className="iui-spacer" aria-hidden />,
});

export const Form = defineComponent({
  name: "Form",
  props: z.object({ children }),
  description: "Groups fields; their values go with any @ToAssistant inside.",
  component: function FormView({ props, renderNode, statementId }) {
    const id = useId();
    return (
      <FormNameContext.Provider value={statementId ?? id}>
        <form className="iui-form" onSubmit={(event) => event.preventDefault()}>
          {renderNode(props.children)}
        </form>
      </FormNameContext.Provider>
    );
  },
});
