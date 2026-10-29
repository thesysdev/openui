"use client";

/**
 * Shared by the control components. These lived at the top of controls.tsx and
 * moved here so the controls in that file and the ones extracted into their own
 * directories use a single copy.
 */
import {
  ACTION_STEPS,
  parseStructuredRules,
  useFormName,
  useFormValidation,
  useTriggerAction,
} from "@openuidev/react-lang";
import { CircleAlert } from "lucide-react";
import { useEffect, useId, useMemo, useRef, type ReactNode } from "react";
import { z } from "zod/v4";
import { option, toOption, type Option } from "./style";

type Plan = Parameters<ReturnType<typeof useTriggerAction>>[2];

type Step = { type: string; refType?: string };

/** Whether an action sends something on, as the chat kit's Button decides: to the assistant, a tool, or a mutation. */
const sends = (plan: unknown) => {
  const steps = (plan as { steps?: Step[] }).steps;
  if (!steps) return true;
  return steps.some(
    (s) =>
      s.type === ACTION_STEPS.ToAssistant ||
      s.type === "custom_action" ||
      (s.type === ACTION_STEPS.Run && s.refType === "mutation"),
  );
};

/**
 * Runs an action prop. With no action, a button sends its label to the
 * assistant. Inside a Form, anything that sends checks the fields' rules first
 * and stops on an error; a @Set step, such as a stepper's +, never does.
 */
export function useRunAction() {
  const trigger = useTriggerAction();
  const formName = useFormName();
  const form = useFormValidation();
  return (message: string, plan: unknown, sendLabel: boolean) => {
    if (!plan && !sendLabel) return;
    if (form && (!plan || sends(plan)) && !form.validateForm()) return;
    if (plan) void trigger(message, formName, plan as Plan);
    else void trigger(message, formName);
  };
}

/**
 * A field's rules inside a Form. Registers them so a send checks the field
 * first, and returns the field's error, whether it is required, and handlers
 * that check it (on blur) and clear it (on edit). Outside a Form, or with no
 * rules, it does nothing.
 */
export function useFieldRules(name: string, rules: unknown, value: unknown) {
  const form = useFormValidation();
  const key = JSON.stringify(rules ?? null);
  // Keyed on the rules' content: the program re-creates the object each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const parsed = useMemo(() => parseStructuredRules(rules), [key]);
  const latest = useRef(value);
  latest.current = value;
  const active = !!form && parsed.length > 0;
  const register = form?.registerField;
  const unregister = form?.unregisterField;
  useEffect(() => {
    if (!register || !unregister || parsed.length === 0) return;
    register(name, parsed, () => latest.current);
    return () => unregister(name);
  }, [register, unregister, name, parsed]);
  return {
    required: active && parsed.some((rule) => rule.type === "required"),
    error: active ? form.errors[name] : undefined,
    check: () => {
      if (active) form.validateField(name, latest.current, parsed);
    },
    clear: () => {
      if (active) form.clearFieldError(name);
    },
  };
}

/** The state key of a control: its label, its statement name, or a generated id. */
export function useFieldName(label: unknown, statementId?: string) {
  const id = useId();
  return (typeof label === "string" && label) || statementId || id;
}

export const numberText = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

/** A required field's marker after its label. */
export const Required = () => (
  <span className="iui-required" aria-hidden="true">
    *
  </span>
);

/** A field's validation error, under the field. */
export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <span className="iui-field-error" role="alert">
      <CircleAlert size={14} aria-hidden />
      {error}
    </span>
  );
}

/** Wraps a control in its label and error, or renders it bare when it has neither. */
export function Field({
  label,
  required,
  error,
  children: content,
}: {
  label?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  if (!label && !error) return <>{content}</>;
  return (
    <label className="iui-field">
      {label ? (
        <span className="iui-label">
          {label}
          {required ? <Required /> : null}
        </span>
      ) : null}
      {content}
      <FieldError error={error} />
    </label>
  );
}

/** Option lists, shared by Select, SegmentedControl and RadioGroup. */
export const options = z.array(option);
export const optionList = (value: unknown) =>
  Array.isArray(value) ? (value.flat() as Option[]).filter((o) => o != null).map(toOption) : [];

export const choice = z.union([
  z.string(),
  z.object({ value: z.string(), label: z.string(), description: z.string().optional() }),
]);
export type Choice = { value: string; label: string; description?: string };
export const choiceList = (value: unknown): Choice[] =>
  Array.isArray(value)
    ? (value.flat() as (string | Choice)[])
        .filter((o) => o != null)
        .map((o) => (typeof o === "string" ? { value: o, label: o } : o))
    : [];
