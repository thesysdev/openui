import { useFormName, useGetFieldValue, useSetFieldValue } from "@openuidev/solid-lang";
import { createMemo } from "solid-js";

interface TextAreaFieldProps {
  label: string;
  placeholder?: string;
  value?: unknown;
  rows?: number;
}

function getStateRefName(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const node = value as { k?: string; n?: string };
  return node.k === "StateRef" && typeof node.n === "string" ? node.n : null;
}

export function TextAreaField(props: { props: TextAreaFieldProps }) {
  const formName = useFormName();
  const getFieldValue = useGetFieldValue();
  const setFieldValue = useSetFieldValue();

  const bindingName = createMemo(() => getStateRefName(props.props.value));
  const fieldValue = createMemo(() => {
    const name = bindingName();
    if (name) return (getFieldValue(formName?.(), name) ?? "") as string;
    return (props.props.value as string | undefined) ?? "";
  });

  return (
    <label style={{ display: "grid", gap: "6px" }}>
      <span style={{ "font-size": "12px", "font-weight": 600, color: "#334155" }}>
        {props.props.label}
      </span>
      <textarea
        value={fieldValue()}
        placeholder={props.props.placeholder || ""}
        rows={props.props.rows || 4}
        onInput={(event) => {
          const name = bindingName();
          if (!name) return;
          setFieldValue(formName?.(), "TextAreaField", name, event.currentTarget.value, true);
        }}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #cbd5e1",
          "border-radius": "10px",
          background: "#ffffff",
          color: "#0f172a",
          "font-size": "13px",
          "line-height": 1.5,
          resize: "vertical",
          "box-sizing": "border-box",
        }}
      />
    </label>
  );
}
