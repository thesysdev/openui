"use client";

/**
 * Shared by the control components. These lived at the top of controls.tsx and
 * moved here so the controls in that file and the ones extracted into their own
 * directories use a single copy.
 */
import { useFormName, useTriggerAction } from "@openuidev/react-lang";
import { useId, type ReactNode } from "react";
import { z } from "zod/v4";
import { option, toOption, type Option } from "./style";

type Plan = Parameters<ReturnType<typeof useTriggerAction>>[2];

/** Runs an action prop. With no action, a button sends its label to the assistant. */
export function useRunAction() {
  const trigger = useTriggerAction();
  const formName = useFormName();
  return (message: string, plan: unknown, sendLabel: boolean) => {
    if (plan) void trigger(message, formName, plan as Plan);
    else if (sendLabel) void trigger(message, formName);
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

/** Wraps a control in its label, or renders it bare when unlabelled. */
export function Field({ label, children: content }: { label?: string; children: ReactNode }) {
  if (!label) return <>{content}</>;
  return (
    <label className="iui-field">
      <span className="iui-label">{label}</span>
      {content}
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
