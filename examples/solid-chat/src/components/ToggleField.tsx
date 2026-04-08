import { useFormName, useGetFieldValue, useSetFieldValue } from "@openuidev/solid-lang";
import { createMemo } from "solid-js";

interface ToggleFieldProps {
  label: string;
  checked?: unknown;
}

function getStateRefName(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const node = value as { k?: string; n?: string };
  return node.k === "StateRef" && typeof node.n === "string" ? node.n : null;
}

export function ToggleField(props: { props: ToggleFieldProps }) {
  const formName = useFormName();
  const getFieldValue = useGetFieldValue();
  const setFieldValue = useSetFieldValue();

  const bindingName = createMemo(() => getStateRefName(props.props.checked));
  const checked = createMemo(() => {
    const name = bindingName();
    if (name) return Boolean(getFieldValue(formName?.(), name));
    return Boolean(props.props.checked);
  });

  return (
    <div
      style={{
        display: "flex",
        "justify-content": "space-between",
        "align-items": "center",
        gap: "10px",
        padding: "10px 12px",
        border: "1px solid rgba(148,163,184,0.3)",
        "border-radius": "10px",
        background: "#ffffff",
      }}
    >
      <span style={{ "font-size": "13px", color: "#334155", "font-weight": 600 }}>
        {props.props.label}
      </span>
      <button
        type="button"
        onClick={() => {
          const name = bindingName();
          if (!name) return;
          setFieldValue(formName?.(), "ToggleField", name, !checked(), true);
        }}
        style={{
          position: "relative",
          width: "38px",
          height: "22px",
          "border-radius": "999px",
          background: checked() ? "#3b82f6" : "#cbd5e1",
          transition: "all 120ms ease",
          border: "1px solid rgba(148,163,184,0.5)",
          cursor: bindingName() ? "pointer" : "default",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: checked() ? "18px" : "2px",
            width: "16px",
            height: "16px",
            "border-radius": "999px",
            background: "#ffffff",
            "box-shadow": "0 1px 3px rgba(15,23,42,0.25)",
            transition: "all 120ms ease",
          }}
        />
      </button>
    </div>
  );
}
