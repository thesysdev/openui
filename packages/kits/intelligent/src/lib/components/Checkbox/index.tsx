"use client";

import { CheckBoxItem } from "@openuidev/react-components";
import { defineComponent, useStateField } from "@openuidev/react-lang";
import { useFieldName } from "../controlHelpers";
import { cx } from "../style";
import { CheckboxSchema } from "./schema";

export * from "./schema";

export const Checkbox = defineComponent({
  name: "Checkbox",
  props: CheckboxSchema,
  description: "lineThrough strikes the label when checked, for to-do lists.",
  component: ({ props, statementId }) => {
    const field = useStateField(useFieldName(props.label, statementId), props.checked);
    const checked = field.value === true;
    // CheckBoxItem has no lineThrough, so the kit's class still supplies the
    // strike-through that to-do lists in the prompt examples rely on.
    return (
      <span className={cx(props.lineThrough && checked && "iui-check is-done")}>
        <CheckBoxItem label={String(props.label ?? "")} checked={checked} onChange={(next) => field.setValue(next)} />
      </span>
    );
  },
});
