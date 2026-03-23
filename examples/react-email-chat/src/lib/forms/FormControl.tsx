"use client";

import { defineComponent, useFormValidation } from "@openuidev/react-lang";
import { z } from "zod";
import { Input } from "./Input";
import { RadioGroup } from "./RadioGroup";
import { Select } from "./Select";
import { TextArea } from "./TextArea";

const isDark = () =>
  typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false;

export const FormControl = defineComponent({
  name: "FormControl",
  props: z.object({
    label: z.string(),
    input: z.union([Input.ref, TextArea.ref, Select.ref, RadioGroup.ref]),
    hint: z.string().optional(),
  }),
  description: "Field with label, input component, and optional hint text",
  component: ({ props, renderNode }) => {
    const formValidation = useFormValidation();
    const dark = isDark();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputObj = props.input as any;
    const fieldName =
      inputObj?.type === "element" ? (inputObj.props?.name as string | undefined) : undefined;
    const error = fieldName ? formValidation?.errors[fieldName] : undefined;
    const isRequired = inputObj?.type === "element" && inputObj.props?.rules?.required === true;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <label
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: dark ? "#e0e0e0" : "#1a1a1a",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {props.label as string}
          {isRequired && <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>}
        </label>
        {renderNode(props.input)}
        {error ? (
          <span
            style={{
              fontSize: "12px",
              color: "#ef4444",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {error}
          </span>
        ) : props.hint ? (
          <span
            style={{
              fontSize: "12px",
              color: dark ? "#999" : "#6b7280",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {props.hint as string}
          </span>
        ) : null}
      </div>
    );
  },
});
