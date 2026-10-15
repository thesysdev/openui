"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import {
  EntityList as OpenUIEntityList,
  type EntityListRow as OpenUIEntityListRow,
} from "../../components/EntityList";
import { asArray } from "../helpers";
import { renderOneOrMany } from "../oneOrMany";
import { EntityListSchema, type EntityListProps, type EntityListRow } from "./schema";

export * from "./schema";

function EntityListRenderer({ props, renderNode }: ComponentRenderProps<EntityListProps>) {
  // Strings pass through as text; EntityTitle, LeadingText, Metric, Tag and
  // Text nodes render as themselves.
  const cell = (value: unknown) => renderOneOrMany(value, renderNode);
  // Rows are EntityListItem nodes; a bare { left, right } object also works.
  const toRow = (node?: unknown): OpenUIEntityListRow | undefined => {
    if (!node) return undefined;
    const row = ((node as { props?: EntityListRow }).props ?? node) as EntityListRow;
    return { left: cell(row.left), right: cell(row.right), rightVariant: row.rightVariant };
  };
  return (
    <OpenUIEntityList
      rows={asArray(props.rows).map((r) => toRow(r)!)}
      size={props.size}
      header={toRow(props.header)}
      footer={toRow(props.footer)}
    />
  );
}

export const EntityList = defineComponent({
  name: "EntityList",
  props: EntityListSchema,
  description:
    'A compact list of EntityListItem rows, each a left item and an optional right value: EntityListItem(left, right?, rightVariant?). Keep left a plain string for simple key/value facts, e.g. EntityListItem("Check-in", "3pm"). Use an EntityTitle on the left when each row is a person, company or product the reader should recognise, e.g. a team list or top customers, and a LeadingText when each row is a fact with an icon cue. right is a value string, a Metric (a number with a change), a Tag (a status) or a Text; leave it out for a plain list of entities. rightVariant "number" lines up string numbers with tabular figures. size "default" supports an optional header row for column labels and a footer row for a total, both EntityListItems; "small" has neither and is only for a CompositeCardItem body. When a left or right cell needs two or more pieces side by side, pass an array and they sit on one line, e.g. EntityListItem("Trail Runner", [Metric("$89", null, null, "sm"), Tag("In stock", null, "success")]); a single piece goes in directly.',
  component: EntityListRenderer,
});
