"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { Grid as OpenUIGrid } from "../../components/Grid";
import { NestedCardContext } from "../nestedCardContext";
import { GridSchema, type GridProps } from "./schema";

export * from "./schema";

// Children are loose so the chat Grid, with its own children union, can share this renderer.
type GridRenderProps = ComponentRenderProps<Omit<GridProps, "children"> & { children: unknown[] }>;

/** Shared renderer — also used by the chat library's Grid variant (typed children). */
export function GridRenderer({ props, renderNode }: GridRenderProps) {
  return (
    <NestedCardContext.Provider value={true}>
      <OpenUIGrid columns={props.columns ?? 2}>{renderNode(props.children)}</OpenUIGrid>
    </NestedCardContext.Provider>
  );
}

export const GRID_DESCRIPTION = `Equal-width columns for dashboards: Grid(children, columns?). columns 2 (default) | 3 | 4 is the most at full width; narrower screens drop to fewer automatically, so never build rows by hand (4 steps down to 2, then 1; 3 and 2 step down to 1). Cells are 12px apart and stretch to the row's height. Fill each cell with one block, usually a Card (outlined by default), or a chart or a card block, and keep the cells of one Grid the same kind, titled with the Card's own title (not a Heading child). Never put a Heading, or a Heading plus its content, in a Grid cell: a titled group such as "Top 5 customers" or "Key insights" is a Section with its Heading first and then its Grid or block, e.g. Section([Heading("Key insights"), InsightCard([...])]), e.g. a KPI row Grid([Card([Metric("$48,200", "+8.1%")], null, "Revenue"), ...], 4) above a chart Grid([Card([chart1], null, "Revenue"), Card([chart2], null, "Orders")]). In a chat response the Card's title comes after sources and variant: Card([chart1], null, null, "Revenue"). For a row of mixed widths use a Stack row; for 2+ items of one card type use its card block.`;

export const Grid = defineComponent({
  name: "Grid",
  props: GridSchema,
  description: GRID_DESCRIPTION,
  component: GridRenderer,
});
