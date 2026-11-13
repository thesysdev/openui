"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { useMemo } from "react";
import { Cohorts, type CohortsProps } from "../../../components/relationships/Cohorts";
import { toGrid, toNumbers, toStrings } from "../../../shared/values";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { cohortsPropsSchema, type CohortsSchemaProps } from "./schema";
export const CohortsComponent = defineComponent({
  name: "Cohorts",
  props: cohortsPropsSchema,
  description:
    'Retention grid. cohorts, periods and values have one entry per cell: its cohort, its period and the % of that cohort active in it, as query rows give them: Cohorts(c.rows.cohort, c.rows.period, c.rows.retained, c.rows.cohort_size). sizes is the cohort\'s size, repeated on each of its cells. Leave out (or null) the periods a cohort has not reached. Periods start at "Week 0" or "Month 0". A Show switch in the header prints the cells as Percent or Count (people: size × rate), or nothing (None, the default); showValues true opens it on view ("percent" or "people").',
  component: function CohortsView({ props }: ComponentRenderProps<CohortsSchemaProps>) {
    const grid = useMemo(() => {
      const { rows, columns, cells } = toGrid<number>(props.cohorts, props.periods, props.values);
      // A cohort's size is the one on its first cell.
      const cohortOf = toStrings(props.cohorts);
      const sizeOf = toNumbers(props.sizes);
      const sizes = rows.map((cohort) => sizeOf[cohortOf.indexOf(cohort)] ?? null);
      return { cohorts: rows, periods: columns, values: cells, sizes };
    }, [props.cohorts, props.periods, props.values, props.sizes]);
    return <Cohorts {...props} {...grid} />;
  },
});

// Every schema field reaches Cohorts.
export type CohortsSchemaCovered = Covered<SchemaCoverage<CohortsSchemaProps, CohortsProps>>;
