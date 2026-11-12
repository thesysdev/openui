"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { Row, type RowProps } from "../../../components/structure/Row";
import type { RowHeight } from "../../../components/structure/Row/Row";
import type { Width } from "../../../shared/schema";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { rowPropsSchema, type RowSchemaProps } from "./schema";

export const RowComponent = defineComponent({
  name: "Row",
  props: rowPropsSchema,
  description:
    "Cards side by side on a 12-column grid; their widths add up to a full row. Every card in a row is the same height, one of 240, 320, 400, 480, 560 or 640 px, and its chart stretches to fill it. Leave height out and the row picks one from its content: 400 for charts, 560 for tables, GeoMap and Flow, 480 for PointMap and Cohorts, 320 for summaries (Stat, KeyValues, SegmentedBar).",
  component: RowView,
});

const TALL: Record<string, RowHeight> = {
  Table: 560,
  GeoMap: 560,
  Flow: 560,
  PointMap: 480,
  Cohorts: 480,
};
const COMPACT = new Set(["Stat", "KeyValues", "SegmentedBar"]);
function cardHeight(card: unknown): RowHeight {
  const content = (card as { props?: { content?: unknown } } | null)?.props?.content;
  const kinds = (Array.isArray(content) ? content : []).map(
    (node) => (node as { typeName?: string } | null)?.typeName ?? "",
  );
  if (!kinds.length) return 400;
  if (kinds.every((kind) => COMPACT.has(kind))) return 320;
  return kinds.reduce<RowHeight>(
    (tallest, kind) => Math.max(tallest, TALL[kind] ?? 400) as RowHeight,
    400,
  );
}

function RowView({ props, renderNode }: ComponentRenderProps<RowSchemaProps>) {
  const items = Array.isArray(props.items) ? props.items : [];
  return (
    <Row
      height={props.height}
      items={items.map((item) => ({
        children: renderNode(item),
        width: (item as { props?: { width?: Width | null } } | null)?.props?.width ?? "half",
        height: cardHeight(item),
      }))}
    />
  );
}

// Every schema field reaches Row.
export type RowSchemaCovered = Covered<SchemaCoverage<RowSchemaProps, RowProps>>;
