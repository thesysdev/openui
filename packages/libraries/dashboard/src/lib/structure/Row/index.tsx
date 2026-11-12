"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { Row, type RowProps } from "../../../components/structure/Row";
import { ROW_HEIGHTS, type RowHeight } from "../../../components/structure/Row/Row";
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
  GeoMap: 560,
  Flow: 560,
  PointMap: 480,
  Cohorts: 480,
};
const COMPACT = new Set(["Stat", "KeyValues", "SegmentedBar"]);
/** Content with a height of its own, which a card fits rather than stretching to the row. */
const FITS = new Set(["Table", "KeyValues", "Donut"]);

type Node = {
  typeName?: string;
  props?: {
    columns?: unknown;
    values?: unknown;
    label?: unknown;
    total?: unknown;
    pageSize?: unknown;
    totals?: unknown;
    groupBy?: unknown;
  };
} | null;
const contentOf = (card: unknown): Node[] => {
  const content = (card as { props?: { content?: unknown } } | null)?.props?.content;
  return Array.isArray(content) ? (content as Node[]) : [];
};

/** The card height a Table needs: its title, header, one page of rows, then totals and pager. */
function tableHeight(table: Node): RowHeight {
  const columns = Array.isArray(table?.props?.columns) ? (table.props.columns as Node[]) : [];
  const count = (column: Node) =>
    Array.isArray(column?.props?.values) ? column.props.values.length : 0;
  const rows = Math.max(0, ...columns.map(count));
  const pageSize = typeof table?.props?.pageSize === "number" ? table.props.pageSize : 10;
  const shown = Math.min(rows, Math.max(1, pageSize));
  const totals = table?.props?.totals === true && columns.some((column) => column?.props?.total);
  const groupBy = table?.props?.groupBy;
  const groupColumn = columns.find((column) => column?.props?.label === groupBy);
  const groups =
    typeof groupBy === "string" && groupColumn && Array.isArray(groupColumn.props?.values)
      ? new Set(groupColumn.props.values.slice(0, shown).map(String)).size
      : 0;
  const needed =
    TABLE.chrome +
    shown * TABLE.row +
    groups * TABLE.group +
    (totals ? TABLE.totals : 0) +
    (rows > pageSize ? TABLE.pager : 0);
  return ROW_HEIGHTS.find((height) => height >= needed) ?? 640;
}
/** Measured px (a full-width card): the card's title, padding and the table's header; a row; a
 *  group band; the totals row; the pager. A 4-row table's card is 103 + 4 × 36 = 247px. */
const TABLE = { chrome: 103, row: 36, group: 49, totals: 60, pager: 36 };

function cardHeight(card: unknown): RowHeight {
  const nodes = contentOf(card);
  const kinds = nodes.map((node) => node?.typeName ?? "");
  if (!kinds.length) return 400;
  if (kinds.every((kind) => COMPACT.has(kind))) return 320;
  return nodes.reduce<RowHeight>(
    (tallest, node) =>
      Math.max(
        tallest,
        node?.typeName === "Table" ? tableHeight(node) : (TALL[node?.typeName ?? ""] ?? 400),
      ) as RowHeight,
    kinds.includes("Table") && kinds.every((kind) => kind === "Table") ? 240 : 400,
  );
}

/** A card whose content all sizes itself. */
const fitsContent = (card: unknown) => {
  const kinds = contentOf(card).map((node) => node?.typeName ?? "");
  return kinds.length > 0 && kinds.every((kind) => FITS.has(kind));
};

function RowView({ props, renderNode }: ComponentRenderProps<RowSchemaProps>) {
  const items = Array.isArray(props.items) ? props.items : [];
  return (
    <Row
      height={props.height}
      items={items.map((item) => ({
        children: renderNode(item),
        width: (item as { props?: { width?: Width | null } } | null)?.props?.width ?? "half",
        height: cardHeight(item),
        fit: fitsContent(item),
      }))}
    />
  );
}

// Every schema field reaches Row.
export type RowSchemaCovered = Covered<SchemaCoverage<RowSchemaProps, RowProps>>;
