"use client";

import {
  defineComponent,
  useFormName,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
} from "@openuidev/react-lang";
import React from "react";
import { z } from "zod";

const isDark = () =>
  typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false;

export const TextArea = defineComponent({
  name: "TextArea",
  props: z.object({
    name: z.string(),
    placeholder: z.string().optional(),
    rows: z.number().optional(),
  }),
  description: "Multi-line text input",
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();

    const fieldName = props.name as string;
    const savedValue = getFieldValue(formName, fieldName) ?? "";
    const dark = isDark();

    return (
      <textarea
        name={fieldName}
        placeholder={(props.placeholder as string) || ""}
        rows={(props.rows as number) || 3}
        defaultValue={savedValue}
        disabled={isStreaming}
        onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
          const val = e.target.value;
          if (val !== savedValue) {
            setFieldValue(formName, "TextArea", fieldName, val, true);
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
          resize: "vertical" as const,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      />
    );
  },
});
