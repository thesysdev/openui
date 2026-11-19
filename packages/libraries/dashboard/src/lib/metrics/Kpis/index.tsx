"use client";

import { defineComponent, useIsStreaming, type ComponentRenderProps } from "@openuidev/react-lang";
import { Kpis, type KpisProps } from "../../../components/metrics/Kpis";
import { nodeList } from "../../../shared/values";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import type { KpiSchemaProps } from "../Kpi/schema";
import { kpisPropsSchema, type KpisSchemaProps } from "./schema";

export const KpisComponent = defineComponent({
  name: "Kpis",
  props: kpisPropsSchema,
  description:
    "A strip of Kpi tiles that lays itself out: up to 6 per row, wrapping into balanced rows when narrow. More than 6 render as compact items (value, then label and change) that wrap the same way; sparklines and hints are left out there. Tiles are equal width; just list them.",
  component: KpisView,
});

function KpisView({ props, renderNode }: ComponentRenderProps<KpisSchemaProps>) {
  const streaming = useIsStreaming();
  const items = Array.isArray(props.items) ? props.items : [];
  // Both forms of each tile: Kpis alone decides when the strip turns compact and which it draws.
  return (
    <Kpis
      items={items.map((item) => renderNode(item))}
      facts={nodeList<KpiSchemaProps>(items)}
      streaming={streaming}
    />
  );
}

// Every schema field reaches Kpis (items are rendered into tiles and read as facts).
export type KpisSchemaCovered = Covered<SchemaCoverage<KpisSchemaProps, KpisProps>>;
