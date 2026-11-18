/**
 * Slack modal building: Form children are extracted into FieldSpecs during the
 * walk (fieldSpec), and a FormSpec becomes a modal view when its trigger button
 * is clicked (buildModal).
 */
import type { WalkCtx } from "../core/types";
import type { FieldSpec, FormSpec } from "../ui/types";
import { asText } from "./helpers";

/** Extract a form field's binding + current value for later modal building. */
export function fieldSpec(node: any, ctx: WalkCtx): FieldSpec | null {
  const p = node?.props ?? {};
  const target = ctx.bindTarget(node?.typeName === "MultiSelect" ? p.values : p.value);
  if (!target) return null;
  const label = asText(p.label) || asText(p.name) || target;
  const initial = ctx.state[target];
  // Neutral {value, label} pairs; inputElement maps them to plain_text at modal-build time.
  const options = (p.options ?? []).map((o: any) => ({
    value: asText(o?.props?.value),
    label: asText(o?.props?.label),
  }));
  switch (node?.typeName) {
    case "TextInput":
      return { target, kind: "text", label, initial };
    case "TextArea":
      return { target, kind: "textarea", label, initial };
    case "NumberInput":
      return { target, kind: "number", label, initial };
    case "EmailInput":
      return { target, kind: "email", label, initial };
    case "URLInput":
      return { target, kind: "url", label, initial };
    case "Select":
      return { target, kind: "select", label, initial, options };
    case "MultiSelect":
      return { target, kind: "multiselect", label, initial, options };
    case "DatePicker":
      return { target, kind: "date", label, initial };
    case "TimePicker":
      return { target, kind: "time", label, initial };
    case "DateTimePicker":
      return { target, kind: "datetime", label, initial };
    default:
      return null;
  }
}

/** Callback id of the modals forms open; route `view_submission`s with it to handleViewSubmission. */
export const FORM_CALLBACK_ID = "openui_form";

/** Build a Slack modal view from a FormSpec, opened when a Form's trigger is clicked. */
export function buildModal(spec: FormSpec, privateMetadata: string) {
  return {
    type: "modal",
    callback_id: FORM_CALLBACK_ID,
    private_metadata: privateMetadata,
    title: { type: "plain_text", text: (spec.title || "Form").slice(0, 24) },
    submit: { type: "plain_text", text: (spec.submit || "Submit").slice(0, 24) },
    close: { type: "plain_text", text: "Cancel" },
    blocks: spec.fields.map(inputBlock),
  };
}

function inputBlock(field: FieldSpec) {
  return {
    type: "input",
    block_id: field.target,
    label: { type: "plain_text", text: (field.label || field.target).slice(0, 2000) },
    element: inputElement(field),
  };
}

function inputElement(field: FieldSpec): any {
  const action_id = field.target;
  const initial = field.initial;
  const hasInitial = initial != null && initial !== "";
  const options = field.options ?? [];
  const textInput = {
    type: "plain_text_input",
    action_id,
    ...(hasInitial ? { initial_value: String(initial) } : {}),
  };
  const slackOptions = options.map((o) => ({
    text: { type: "plain_text", text: o.label },
    value: o.value,
  }));
  // Option-based fields need >=1 option; fall back to a text field if the
  // options (often from a Query) came back empty.
  const emptyOptions = () => {
    console.warn(
      `[openui] form ${field.kind} "${field.label}" has no options - likely a Query shape mismatch; using a text field`,
    );
    return textInput;
  };
  switch (field.kind) {
    case "textarea":
      return { ...textInput, multiline: true };
    case "number":
      return {
        type: "number_input",
        action_id,
        is_decimal_allowed: false,
        ...(hasInitial ? { initial_value: String(initial) } : {}),
      };
    case "email":
      return {
        type: "email_text_input",
        action_id,
        ...(hasInitial ? { initial_value: String(initial) } : {}),
      };
    case "url":
      return {
        type: "url_text_input",
        action_id,
        ...(hasInitial ? { initial_value: String(initial) } : {}),
      };
    case "select": {
      if (!slackOptions.length) return emptyOptions();
      const opt = slackOptions.find((o) => o.value === String(initial ?? ""));
      return {
        type: "static_select",
        action_id,
        options: slackOptions,
        ...(opt ? { initial_option: opt } : {}),
      };
    }
    case "multiselect": {
      if (!slackOptions.length) return emptyOptions();
      const chosen = Array.isArray(initial) ? initial.map(String) : [];
      const opts = slackOptions.filter((o) => chosen.includes(o.value));
      return {
        type: "multi_static_select",
        action_id,
        options: slackOptions,
        ...(opts.length ? { initial_options: opts } : {}),
      };
    }
    case "date":
      return {
        type: "datepicker",
        action_id,
        ...(initial ? { initial_date: String(initial) } : {}),
      };
    case "time":
      return {
        type: "timepicker",
        action_id,
        ...(initial ? { initial_time: String(initial) } : {}),
      };
    case "datetime":
      return {
        type: "datetimepicker",
        action_id,
        ...(hasInitial ? { initial_date_time: Number(initial) } : {}),
      };
    default:
      return textInput;
  }
}
