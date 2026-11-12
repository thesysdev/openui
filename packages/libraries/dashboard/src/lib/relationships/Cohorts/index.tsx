"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { Cohorts, type CohortsProps } from "../../../components/relationships/Cohorts";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { cohortsPropsSchema, type CohortsSchemaProps } from "./schema";
export const CohortsComponent = defineComponent({
  name: "Cohorts",
  props: cohortsPropsSchema,
  description:
    'Retention grid: rows[i][j] is the % of cohort i active in period j; null for periods not reached. Periods start at "Week 0" or "Month 0". A Show switch in the header prints the cells as Percent or Count (people: size × rate), or nothing (None, the default); showValues true opens it on view ("percent" or "people").',
  component: function CohortsView({ props }: ComponentRenderProps<CohortsSchemaProps>) {
    return <Cohorts {...props} />;
  },
});

// Every schema field reaches Cohorts.
export type CohortsSchemaCovered = Covered<SchemaCoverage<CohortsSchemaProps, CohortsProps>>;
