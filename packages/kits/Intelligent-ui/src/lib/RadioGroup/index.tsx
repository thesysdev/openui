"use client";

import { defineComponent, useStateField } from "@openuidev/react-lang";
import { RadioGroup as RadioGroupView } from "../../components/RadioGroup";
import { choiceList, useFieldName, useFieldRules } from "../controlHelpers";
import { RadioGroupSchema } from "./schema";

export * from "./schema";

export const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: RadioGroupSchema,
  description: "pills for short choices; cards for choices that need a description line.",
  component: function RadioGroupBinding({ props, statementId }) {
    const fieldName = useFieldName(props.label, statementId);
    const field = useStateField(fieldName, props.value);
    const value = field.value == null ? "" : String(field.value);
    const rules = useFieldRules(fieldName, props.rules, value);
    return (
      <RadioGroupView
        options={choiceList(props.options)}
        value={value}
        onChange={(next) => {
          rules.clear();
          field.setValue(next);
        }}
        variant={props.variant}
        label={props.label}
        required={rules.required}
        error={rules.error}
      />
    );
  },
});
