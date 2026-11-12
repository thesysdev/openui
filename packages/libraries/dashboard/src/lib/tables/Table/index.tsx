"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { useMemo } from "react";
import { Table, type TableProps } from "../../../components/tables/Table";
import { nodeList } from "../../../shared/values";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import type { ColumnSchemaProps } from "../Column/schema";
import { tablePropsSchema, type TableSchemaProps } from "./schema";

export const TableComponent = defineComponent({
  name: "Table",
  props: tablePropsSchema,
  description:
    "Sortable, paged table (default pageSize 10). totals adds a totals row for Columns that set total. search is the text to keep matching rows for: pass the same $variable as a SearchFilter's value. groupBy names a column (usually a chip or badge column) to group rows under a heading with their count.",
  component: function TableView({ props }: ComponentRenderProps<TableSchemaProps>) {
    // Filtered values can be null for a render while $state settles; treat them as empty.
    const columns = useMemo(
      () =>
        nodeList<ColumnSchemaProps>(props.columns).map((column) => ({
          ...column,
          values: Array.isArray(column.values) ? column.values : [],
        })),
      [props.columns],
    );
    return <Table {...props} columns={columns} />;
  },
});

// Every schema field reaches Table (columns are read from the Column nodes).
export type TableSchemaCovered = Covered<SchemaCoverage<TableSchemaProps, TableProps>>;
