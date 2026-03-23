"use client";

import {
  defineComponent,
  parseStructuredRules,
  useFormName,
  useFormValidation,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
} from "@openuidev/react-lang";
import React from "react";
import { z } from "zod";

const isDark = () =>
  typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false;

export const Input = defineComponent({
  name: "Input",
  props: z.object({
    name: z.string(),
    type: z.string().optional(),
    placeholder: z.string().optional(),
    rules: z
      .object({
        required: z.boolean().optional(),
      })
      .optional(),
  }),
  description: "Text input field",
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const fieldName = props.name as string;
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const savedValue = getFieldValue(formName, fieldName) ?? "";
    const dark = isDark();

    React.useEffect(() => {
      if (!isStreaming && rules.length > 0 && formValidation) {
        formValidation.registerField(fieldName, rules, () => getFieldValue(formName, fieldName));
        return () => formValidation.unregisterField(fieldName);
      }
      return undefined;
    }, [isStreaming, rules.length > 0]);

    return (
      <input
        name={fieldName}
        type={(props.type as string) || "text"}
        placeholder={(props.placeholder as string) || ""}
        defaultValue={savedValue}
        disabled={isStreaming}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
          const val = e.target.value;
          if (val !== savedValue) {
            setFieldValue(formName, "Input", fieldName, val, true);
          }
        }}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: dark ? "1px solid #444" : "1px solid #d1d5db",
          borderRadius: "6px",
          fontSize: "14px",
          lineHeight: "1.5",
          color: dark ? "#e0e0e0" : "#1a1a1a",
          backgroundColor: dark ? "#1e1e1e" : "#fff",
          outline: "none",
          boxSizing: "border-box" as const,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      />
    );
  },
});
