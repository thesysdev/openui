"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Grid as GridView } from "../../components/Grid";
import { GridSchema } from "./schema";

export * from "./schema";

export const Grid = defineComponent({
  name: "Grid",
  props: GridSchema,
  description: "Equal columns (default 2). With minChildWidth (px), columns drop on narrow screens.",
  component: ({ props, renderNode }) => (
    <GridView columns={props.columns} gap={props.gap} minChildWidth={props.minChildWidth}>
      {renderNode(props.children)}
    </GridView>
  ),
});
