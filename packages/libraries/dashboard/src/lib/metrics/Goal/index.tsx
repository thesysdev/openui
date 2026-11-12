"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { Goal, type GoalProps } from "../../../components/metrics/Goal";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { goalPropsSchema, type GoalSchemaProps } from "./schema";

export const GoalComponent = defineComponent({
  name: "Goal",
  props: goalPropsSchema,
  description:
    'Progress toward a target. pace (0–1) is how far through the period we are; the bar marks ahead/behind pace. goodWhen "down" makes target a ceiling (churn ≤ 2%). The bar takes the state\'s colour; past its target or limit, a tick marks it and the overrun shows beyond, with the amount named. Stack several in one Card. previous is where it stood at the same point last period: a grey tick on the track while compare is on. For a single headline number with a target, use a Kpi with target instead; Goal is for several targets stacked in one card.',
  component: GoalView,
});

function GoalView({ props }: ComponentRenderProps<GoalSchemaProps>) {
  return <Goal {...props} />;
}

// Every schema field reaches Goal.
export type GoalSchemaCovered = Covered<SchemaCoverage<GoalSchemaProps, GoalProps>>;
