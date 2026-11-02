"use client";

import { EntityList } from "@openuidev/react-components";
import { type ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { type EntityListProps, entityListPropsSchema } from "./schema";
/**
 * Thin adapter over react-components' EntityList. The row contract matches
 * exactly — same `{ left, right, rightVariant }`, same "small" | "default"
 * sizes, same header/footer rules — so the kit only supplies the schema the
 * model is prompted against and lets react-components own the markup.
 */
function EntityListRenderer({ props }: ComponentRenderProps<EntityListProps>) {
  return (
    <EntityList rows={props.rows} size={props.size} header={props.header} footer={props.footer} />
  );
}

export const EntityListComponent = defineComponent({
  name: "EntityList",
  props: entityListPropsSchema,
  description: "",
  component: EntityListRenderer,
});
