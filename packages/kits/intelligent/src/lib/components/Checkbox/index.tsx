"use client";

import { CheckBoxItem } from "@openuidev/react-components";
import { defineComponent, useStateField } from "@openuidev/react-lang";
import { FieldError, useFieldName, useFieldRules } from "../controlHelpers";
import { cx } from "../style";
import { CheckboxSchema } from "./schema";

export * from "./schema";

export const Checkbox = defineComponent({
  name: "Checkbox",
  props: CheckboxSchema,
  description: "lineThrough strikes the label when checked, for to-do lists.",
  component: ({ props, statementId }) => {
    const name = useFieldName(props.label, statementId);
    const field = useStateField(name, props.checked);
    const checked = field.value === true;
    // "required" means ticked; react-lang counts false as a value, so unticked reports empty.
    const rules = useFieldRules(name, props.rules, checked || "");
    // CheckBoxItem has no lineThrough, so the kit's class still supplies the
    // strike-through that to-do lists in the prompt examples rely on.
    return (
      <span className={cx("iui-checkbox", props.lineThrough && checked && "iui-check is-done")}>
        <CheckBoxItem
          label={String(props.label ?? "")}
          checked={checked}
          aria-required={rules.required || undefined}
          aria-invalid={rules.error ? true : undefined}
          onChange={(next) => {
            rules.clear();
            field.setValue(next);
          }}
        />
        <FieldError error={rules.error} />
      </span>
    );
  },
});
