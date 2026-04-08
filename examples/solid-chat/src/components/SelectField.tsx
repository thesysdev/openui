import { useFormName, useGetFieldValue, useSetFieldValue } from "@openuidev/solid-lang";
import { createMemo } from "solid-js";

interface SelectFieldProps {
  label: string;
  options: string[];
  selected?: unknown;
}

function getStateRefName(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const node = value as { k?: string; n?: string };
  return node.k === "StateRef" && typeof node.n === "string" ? node.n : null;
}

export function SelectField(props: { props: SelectFieldProps }) {
  const formName = useFormName();
  const getFieldValue = useGetFieldValue();
  const setFieldValue = useSetFieldValue();

  const bindingName = createMemo(() => getStateRefName(props.props.selected));
  const selectedValue = createMemo(() => {
    const name = bindingName();
    if (name) return (getFieldValue(formName?.(), name) ?? props.props.options[0] ?? "") as string;
    return (props.props.selected as string | undefined) ?? props.props.options[0] ?? "";
  });

  return (
    <label style={{ display: "grid", gap: "6px" }}>
      <span style={{ "font-size": "12px", "font-weight": 600, color: "#334155" }}>
        {props.props.label}
      </span>
      <select
        value={selectedValue()}
        onInput={(event) => {
          const name = bindingName();
          if (!name) return;
          setFieldValue(formName?.(), "SelectField", name, event.currentTarget.value, true);
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
      >
        {props.props.options.map((option) => (
          <option value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
