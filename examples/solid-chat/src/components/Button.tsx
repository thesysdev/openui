import { evaluate } from "@openuidev/lang-core";
import {
  BuiltinActionType,
  useFormName,
  useGetFieldValue,
  useTriggerAction,
} from "@openuidev/solid-lang";
import { Send } from "lucide-solid";

interface ButtonProps {
  label: string;
  action?: unknown;
  variant?: "primary" | "secondary" | "ghost";
}

interface ActionPlanStep {
  type?: string;
  message?: string;
  context?: string;
  url?: string;
}

interface ActionPlanValue {
  steps?: ActionPlanStep[];
}

function isActionPlan(value: unknown): value is ActionPlanValue {
  return !!value && typeof value === "object" && Array.isArray((value as ActionPlanValue).steps);
}

function normalizeActionType(type: string): string {
  if (type === "continue-conversation") return BuiltinActionType.ContinueConversation;
  if (type === "open-url") return BuiltinActionType.OpenUrl;
  return type;
}

export function Button(props: { props: ButtonProps }) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const getFieldValue = useGetFieldValue();
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

  const resolveActionPlan = () => {
    const action = props.props.action;
    if (!action || typeof action !== "object") return null;

    try {
      const evaluated = evaluate(action as any, {
        getState: (name) => getFieldValue(formName?.(), name),
        resolveRef: () => null,
      });
      return isActionPlan(evaluated) ? evaluated : null;
    } catch {
      return null;
    }
  };

  const handleClick = () => {
    const label = props.props.label;
    const form = formName?.();

    if (typeof props.props.action === "string") {
      triggerAction(label, form, { type: normalizeActionType(props.props.action) });
      return;
    }

    const plan = resolveActionPlan();
    if (!plan?.steps?.length) {
      triggerAction(label, form);
      return;
    }

    for (const step of plan.steps) {
      if (step.type === BuiltinActionType.ContinueConversation) {
        triggerAction(step.message || label, form, {
          type: BuiltinActionType.ContinueConversation,
          params: step.context ? { context: step.context } : undefined,
        });
        return;
      }
      if (step.type === BuiltinActionType.OpenUrl && step.url) {
        triggerAction(label, form, {
          type: BuiltinActionType.OpenUrl,
          params: { url: step.url },
        });
        return;
      }
    }

    triggerAction(label, form);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
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
