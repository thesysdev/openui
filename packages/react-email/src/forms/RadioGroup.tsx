"use client";

import {
  defineComponent,
  useFormName,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
} from "@openuidev/react-lang";
import { z } from "zod";

const isDark = () =>
  typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false;

export const RadioItem = defineComponent({
  name: "RadioItem",
  props: z.object({
    label: z.string(),
    value: z.string(),
  }),
  description: "Option for RadioGroup",
  component: () => null,
});

export const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: z.object({
    name: z.string(),
    items: z.array(RadioItem.ref),
    defaultValue: z.string().optional(),
  }),
  description: "Radio button group for single selection",
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();

    const fieldName = props.name as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = ((props.items ?? []) as any[]).filter((item) => item?.props?.value);
    const savedValue = getFieldValue(formName, fieldName) ?? (props.defaultValue as string) ?? "";
    const dark = isDark();

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {items.map((item, i) => {
          const value = String(item?.props?.value ?? "");
          const label = String(item?.props?.label || value);
          return (
            <label
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: dark ? "#e0e0e0" : "#1a1a1a",
                cursor: isStreaming ? "not-allowed" : "pointer",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              }}
            >
              <input
                type="radio"
                name={fieldName}
                value={value}
                checked={savedValue === value}
                disabled={isStreaming}
                onChange={() => {
                  setFieldValue(formName, "RadioGroup", fieldName, value, true);
                }}
                style={{ accentColor: "#5F51E8" }}
              />
              {label}
            </label>
          );
        })}
      </div>
    );
  },
});
