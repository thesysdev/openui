"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormValidation,
  useIsStreaming,
  useStateField,
} from "@openuidev/react-lang";
import clsx from "clsx";
import React from "react";
import { TextAreaSchema } from "./schema";

export { TextAreaSchema } from "./schema";

export const TextArea = defineComponent({
  name: "TextArea",
  props: TextAreaSchema,
  description:
    'A multi-line text field inside a FormControl, for free-form notes or messages: TextArea(name, placeholder?, rows?, rules?, value?, variant?), e.g. TextArea("notes", "Dietary needs, accessibility, special requests…", 4). rows sets the visible height; 3–5 is typical. Never require it when leaving it blank is a valid answer. variant "inline" is borderless until hover or focus, for table cells and dense rows; use "default" everywhere else. For a one-line answer use Input.',
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const field = useStateField(props.name, props.value);
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const hasRules = rules.length > 0;

    React.useEffect(() => {
      if (!isStreaming && hasRules && formValidation) {
        formValidation.registerField(field.name, rules, () => field.value);
        return () => formValidation.unregisterField(field.name);
      }
      return undefined;
    }, [field.name, field.value, formValidation, hasRules, isStreaming, rules]);

    return (
      <textarea
        className={clsx("openui-genui-textarea", {
          "openui-genui-textarea--inline": props.variant === "inline",
          "openui-genui-textarea--error": !!formValidation?.errors[field.name],
        })}
        name={field.name}
        placeholder={(props.placeholder as string) || ""}
        rows={(props.rows as number) || (props.variant === "inline" ? 1 : 3)}
        value={field.value ?? ""}
        onFocus={() => formValidation?.clearFieldError(field.name)}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const val = e.target.value;
          field.setValue(val);
          if (hasRules) {
            formValidation?.clearFieldError(field.name);
          }
        }}
        onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
          if (hasRules) {
            formValidation?.validateField(field.name, e.target.value, rules);
          }
        }}
        disabled={isStreaming}
      />
    );
  },
});
