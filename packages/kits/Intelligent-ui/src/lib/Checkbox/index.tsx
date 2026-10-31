"use client";

import { defineComponent, useStateField } from "@openuidev/react-lang";
import { Checkbox as CheckboxView } from "../../components/Checkbox";
import { useFieldName, useFieldRules } from "../controlHelpers";
import { CheckboxSchema } from "./schema";

export * from "./schema";

export const Checkbox = defineComponent({
  name: "Checkbox",
  props: CheckboxSchema,
  description: "lineThrough strikes the label when checked, for to-do lists.",
  component: function CheckboxBinding({ props, statementId }) {
    const name = useFieldName(props.label, statementId);
    const field = useStateField(name, props.checked);
    const checked = field.value === true;
    // "required" means ticked; react-lang counts false as a value, so unticked reports empty.
    const rules = useFieldRules(name, props.rules, checked || "");
    return (
      <CheckboxView
        label={String(props.label ?? "")}
        checked={checked}
        onChange={(next) => {
          rules.clear();
          field.setValue(next);
        }}
        lineThrough={props.lineThrough}
        required={rules.required}
        error={rules.error}
      />
    );
  },
});
