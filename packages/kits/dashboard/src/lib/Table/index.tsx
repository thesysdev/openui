"use client";

import { defineComponent, useIsQueryLoading } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Table as DashboardTable } from "../../components/Table";
import { asArray } from "../helpers";
import { ColSchema } from "./schema";

export { ColSchema } from "./schema";

export const Col = defineComponent({
  name: "Col",
  props: ColSchema,
  description: "Column definition — holds label + data array",
  component: () => null,
});

export const Table = defineComponent({
  name: "Table",
  props: z.object({
    columns: z.array(Col.ref),
  }),
  description: "Data table — column-oriented. Each Col holds its own data array.",
  component: ({ props, renderNode }) => {
    const isQueryLoading = useIsQueryLoading();
    const columns = (props.columns ?? [])
      .filter((c: any) => c != null && c.props)
      .map((c: any) => ({
        label: c.props?.label ?? "",
        cells: asArray(c.props?.data ?? []).map((cell) =>
          typeof cell === "object" && cell !== null ? renderNode(cell) : String(cell ?? ""),
        ),
      }));

    return <DashboardTable columns={columns} loading={isQueryLoading} />;
  },
});

// The registry keys every definition as `<Name>Component`; `Col`/`Table` keep
// their plain names for callers that import the definitions directly.
export { Col as ColComponent, Table as TableComponent };
