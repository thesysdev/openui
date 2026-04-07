import { useTriggerAction } from "@openuidev/solid-lang";
import { Send } from "lucide-solid";

interface ButtonProps {
  label: string;
  action?: string;
  variant?: "primary" | "secondary" | "ghost";
}

export function Button(props: { props: ButtonProps }) {
  const triggerAction = useTriggerAction();
  const variant = props.props.variant || "secondary";

  const variantStyles: Record<
    NonNullable<ButtonProps["variant"]>,
    { bg: string; fg: string; border: string }
  > = {
    primary: { bg: "#0f172a", fg: "#ffffff", border: "#0f172a" },
    secondary: { bg: "#f8fafc", fg: "#0f172a", border: "#cbd5e1" },
    ghost: { bg: "#ffffff", fg: "#1e40af", border: "#bfdbfe" },
  };
  const style = variantStyles[variant];

  return (
    <button
      type="button"
      onClick={() =>
        triggerAction(
          props.props.label,
          undefined,
          props.props.action ? { type: props.props.action } : undefined,
        )
      }
      style={{
        padding: "8px 12px",
        border: `1px solid ${style.border}`,
        "border-radius": "10px",
        background: style.bg,
        color: style.fg,
        cursor: "pointer",
        "font-size": "13px",
        "font-weight": 600,
      }}
    >
      <span style={{ display: "inline-flex", "margin-right": "6px", "vertical-align": "middle" }}>
        <Send size={14} color={style.fg} />
      </span>
      {props.props.label}
    </button>
  );
}
