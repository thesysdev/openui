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

export const SelectItem = defineComponent({
  name: "SelectItem",
  props: z.object({
    label: z.string(),
    value: z.string(),
  }),
  description: "Option for Select",
  component: () => null,
});

export const Select = defineComponent({
  name: "Select",
  props: z.object({
    name: z.string(),
    items: z.array(SelectItem.ref),
    placeholder: z.string().optional(),
    rules: z
      .object({
        required: z.boolean().optional(),
      })
      .optional(),
  }),
  description: "Dropdown select field",
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const fieldName = props.name as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = ((props.items ?? []) as any[]).filter((item) => item?.props?.value);
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const value = getFieldValue(formName, fieldName) ?? "";
    const dark = isDark();

    React.useEffect(() => {
      if (!isStreaming && rules.length > 0 && formValidation) {
        formValidation.registerField(fieldName, rules, () => getFieldValue(formName, fieldName));
        return () => formValidation.unregisterField(fieldName);
      }
      return undefined;
    }, [isStreaming, rules.length > 0]);

    return (
      <select
        name={fieldName}
        value={value}
        disabled={isStreaming}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          setFieldValue(formName, "Select", fieldName, e.target.value, true);
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
      >
        {(props.placeholder as string) && (
          <option value="" disabled>
            {props.placeholder as string}
          </option>
        )}
        {items.map((item, i) => (
          <option key={i} value={String(item?.props?.value ?? "")}>
            {String(item?.props?.label || item?.props?.value || "")}
          </option>
        ))}
      </select>
    );
  },
});
