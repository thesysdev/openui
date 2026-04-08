import { useFormName, useGetFieldValue, useSetFieldValue } from "@openuidev/solid-lang";
import { createMemo } from "solid-js";

interface InputFieldProps {
  label: string;
  placeholder?: string;
  value?: unknown;
  type?: "text" | "email" | "password" | "number" | "url";
}

function getStateRefName(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const node = value as { k?: string; n?: string };
  return node.k === "StateRef" && typeof node.n === "string" ? node.n : null;
}

export function InputField(props: { props: InputFieldProps }) {
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
      <input
        value={fieldValue()}
        placeholder={props.props.placeholder || ""}
        type={props.props.type || "text"}
        onInput={(event) => {
          const name = bindingName();
          if (!name) return;
          setFieldValue(formName?.(), "InputField", name, event.currentTarget.value, true);
        }}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #cbd5e1",
          "border-radius": "10px",
          background: "#ffffff",
          color: "#0f172a",
          "font-size": "13px",
          "box-sizing": "border-box",
        }}
      />
    </label>
  );
}
