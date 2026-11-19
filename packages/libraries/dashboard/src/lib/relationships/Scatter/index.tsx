"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { useMemo } from "react";
import { Scatter, type ScatterProps } from "../../../components/relationships/Scatter";
import type { ReferenceProps } from "../../../shared/trends";
import { nodeList, toNumbers, toStrings } from "../../../shared/values";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { scatterPropsSchema, type ScatterSchemaProps } from "./schema";
export const ScatterComponent = defineComponent({
  name: "Scatter",
  props: scatterPropsSchema,
  description:
    'Two measures per item, one entry per item in labels, xs and ys: Scatter(c.rows.campaign, c.rows.spend, c.rows.roas, "Spend", "ROAS", "currency-compact", "multiplier"). sizes scales each dot by a third measure (sizeLabel names it, e.g. "Signups"); groups gives each item a group. Up to 8 groups, each with its own colour and shape; past eight, the smallest fold into Other. A point with a null x or y isn\'t drawn and is named under the chart. Up to 10 points label themselves. references draw targets or averages: Reference("Avg spend", 12000, "x") is vertical, a y reference horizontal; together they split the plot into quadrants.',
  component: function ScatterView({ props }: ComponentRenderProps<ScatterSchemaProps>) {
    const { labels, xs, ys, sizes, groups, ...rest } = props;
    const points = useMemo(() => {
      const x = toNumbers(xs);
      const y = toNumbers(ys);
      const size = toNumbers(sizes);
      const group = toStrings(groups);
      return toStrings(labels).map((label, i) => ({
        label,
        x: x[i] ?? null,
        y: y[i] ?? null,
        size: size[i] ?? undefined,
        group: group[i] || undefined,
      }));
    }, [labels, xs, ys, sizes, groups]);
    return (
      <Scatter {...rest} points={points} references={nodeList<ReferenceProps>(props.references)} />
    );
  },
});

// Every schema field reaches Scatter (the per-item columns are joined into points here).
export type ScatterSchemaCovered = Covered<
  SchemaCoverage<ScatterSchemaProps, ScatterProps, "labels" | "xs" | "ys" | "sizes" | "groups">
>;
