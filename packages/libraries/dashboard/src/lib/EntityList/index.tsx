"use client";

import { EntityList } from "@openuidev/react-components";
import { type ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { formatMetric } from "../../shared/format";
import { type EntityListProps, type EntityListRow, entityListPropsSchema } from "./schema";

// `right` may be a number (rightVariant "number" asks for one); react-components takes text,
// and dates and large numbers read better formatted.
function toRow(row: EntityListRow) {
  return { ...row, right: formatMetric(row.right == null ? "" : String(row.right)) };
}

/**
 * Thin adapter over react-components' EntityList. The row contract matches
 * — same `{ left, right, rightVariant }`, same "small" | "default" sizes,
 * same header/footer rules — so the kit only supplies the schema the model is
 * prompted against, formats `right`, and lets react-components own the markup.
 */
function EntityListRenderer({ props }: ComponentRenderProps<EntityListProps>) {
  return (
    <EntityList
      rows={(props.rows ?? []).map(toRow)}
      size={props.size}
      header={props.header && toRow(props.header)}
      footer={props.footer && toRow(props.footer)}
    />
  );
}

export const EntityListComponent = defineComponent({
  name: "EntityList",
  props: entityListPropsSchema,
  description:
    'Two-column key/value rows. header and footer show only with size "default"; size "small" takes rows alone.',
  component: EntityListRenderer,
});
