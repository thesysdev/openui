"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { useMemo } from "react";
import { Flow, type FlowProps } from "../../../components/flow/Flow";
import { toNumbers, toStrings } from "../../../shared/values";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { flowPropsSchema, type FlowSchemaProps } from "./schema";
export const FlowComponent = defineComponent({
  name: "Flow",
  props: flowPropsSchema,
  description:
    'Sankey of a quantity between stages. from, to and values have one entry per link, as query rows give them: Flow(f.rows.source, f.rows.target, f.rows.users), or written in: Flow(["Paid search", "Signed up"], ["Signed up", "Activated"], [1210, 640]). Name loss nodes "Dropped", "Exited" or "Churned" (drawn grey). Links only move forward: one that loops back to an earlier node isn\'t drawn. Keep to ~4 columns and ~15 nodes. previous (last period\'s volume, one per link) adds each link\'s and step\'s change to the tooltips while compare is on.',
  component: function FlowView({ props }: ComponentRenderProps<FlowSchemaProps>) {
    const { from, to, values, previous, format } = props;
    const links = useMemo(() => {
      const target = toStrings(to);
      const value = toNumbers(values);
      const before = toNumbers(previous);
      return toStrings(from).map((source, i) => ({
        from: source,
        to: target[i] ?? "",
        value: value[i] ?? 0,
        previous: before[i] ?? undefined,
      }));
    }, [from, to, values, previous]);
    return <Flow links={links} format={format} />;
  },
});

// Every schema field reaches Flow (the per-link columns are joined into links here).
export type FlowSchemaCovered = Covered<
  SchemaCoverage<FlowSchemaProps, FlowProps, "from" | "to" | "values" | "previous">
>;
