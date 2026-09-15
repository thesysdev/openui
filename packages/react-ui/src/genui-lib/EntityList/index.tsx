"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { EntityList as OpenUIEntityList } from "../../components/EntityList";
import { asArray } from "../helpers";
import { EntityListSchema, type EntityListProps, type EntityListRow } from "./schema";

export * from "./schema";

function EntityListRenderer({ props }: ComponentRenderProps<EntityListProps>) {
  return (
    <OpenUIEntityList
      rows={asArray(props.rows) as EntityListRow[]}
      size={props.size}
      header={props.header}
      footer={props.footer}
    />
  );
}

export const EntityList = defineComponent({
  name: "EntityList",
  props: EntityListSchema,
  description:
    "Two-column key/value rows (left label, right value). size 'default' supports optional header and footer rows; rightVariant 'number' uses tabular numbers.",
  component: EntityListRenderer,
});
