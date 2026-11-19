"use client";
import { defineComponent } from "@openuidev/react-lang";
import { Waterfall, type WaterfallProps } from "../../../components/composition/Waterfall";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { waterfallPropsSchema, type WaterfallSchemaProps } from "./schema";
export const WaterfallComponent = defineComponent({
  name: "Waterfall",
  props: waterfallPropsSchema,
  description:
    'How a total moved: the first value is the starting total, the rest are signed changes, the end total is computed. Increases and decreases wear the good/bad status colours; pass goodWhen "down" when a decrease is the good outcome (costs). E.g. Waterfall(["Start MRR", "New", "Expansion", "Churn"], [398200, 18400, 9100, -9300], "currency-compact", "End MRR"). subtotals names labels drawn as the running total at that point (their values are ignored; pass 0), for a P&L: Waterfall(["Revenue", "Cost of sales", "Gross profit", "Operating costs"], [820000, -310000, 0, -280000], "currency-compact", "Operating profit", "up", ["Gross profit"]).',
  component: ({ props }) => <Waterfall {...props} />,
});

// Every schema field reaches Waterfall.
export type WaterfallSchemaCovered = Covered<SchemaCoverage<WaterfallSchemaProps, WaterfallProps>>;
