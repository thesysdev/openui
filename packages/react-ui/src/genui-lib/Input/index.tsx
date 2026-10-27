"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormValidation,
  useIsStreaming,
  useStateField,
} from "@openuidev/react-lang";
import clsx from "clsx";
import { Hash, Link, Lock, Mail, Phone, Search, type LucideIcon } from "lucide-react";
import React from "react";
import { InputSchema } from "./schema";

export { InputSchema } from "./schema";

// Leading icon per input type; plain text fields stay bare.
const typeIcons: Record<string, LucideIcon> = {
  email: Mail,
  password: Lock,
  number: Hash,
  url: Link,
  search: Search,
  tel: Phone,
};

export const Input = defineComponent({
  name: "Input",
  props: InputSchema,
  description:
    'A single-line text field inside a FormControl: Input(name, placeholder?, type?, rules?, value?, variant?), e.g. Input("email", "you@example.com", "email", { required: true, email: true }). Pick type for what is being entered, "email" | "password" | "number" | "url" | "search" | "tel" or "text" (default), because it sets the leading icon and the keyboard automatically. placeholder shows an example value, not the label; the label goes on the FormControl. value binds a $variable for reactive filters such as Input("q", "Search tickets", "search", null, $search). variant "inline" is a borderless field (outlined only on hover or focus, with no leading icon) for table cells and dense rows; use "default" everywhere else. When the answer comes from a known set, prefer Select, DatePicker, Chips or OptionCards.',
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

    const type = (props.type as string) || "text";
    const inline = props.variant === "inline";
    const Icon = inline ? undefined : typeIcons[type];
    const hasError = !!formValidation?.errors[field.name];

    return (
      <div
        className={clsx("openui-genui-input", {
          "openui-genui-input--inline": inline,
          "openui-genui-input--error": hasError,
        })}
      >
        {Icon && <Icon className="openui-genui-input__icon" aria-hidden />}
        <input
          className="openui-genui-input__control"
          autoComplete="off"
          id={field.name}
          name={field.name}
          placeholder={(props.placeholder as string) || ""}
          type={type}
          value={field.value ?? ""}
          onFocus={() => formValidation?.clearFieldError(field.name)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            field.setValue(val);
            if (hasRules) {
              formValidation?.clearFieldError(field.name);
            }
          }}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
            if (hasRules) {
              formValidation?.validateField(field.name, e.target.value, rules);
            }
          }}
          disabled={isStreaming}
        />
      </div>
    );
  },
});
