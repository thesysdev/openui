/**
 * Discord interaction normalizers. Components carry a `custom_id` (max 100
 * chars): buttons and selects use their action id, Form buttons use
 * `form:<formId>`, and modal inputs use the $variable they bind.
 */
import type { Interaction, Snapshot } from "../core/types";
import type { FieldSpec, FormSpec } from "../ui/types";
import type { DiscordModal } from "./types";

export const FORM_PREFIX = "form:";

/** True when a custom_id fits Discord's 100-character limit. */
export function customIdFits(id: string): boolean {
  return id.length > 0 && id.length <= 100;
}

/**
 * Normalize a MESSAGE_COMPONENT interaction's `data` (button or string select).
 * Returns `{ formId }` for a Form button: open `formModal(formId, forms[formId])`
 * instead of updating the message.
 */
export function decodeComponent(data: {
  custom_id: string;
  values?: string[];
}): Interaction & { formId?: string } {
  const id = data.custom_id ?? "";
  if (id.startsWith(FORM_PREFIX)) return { formId: id.slice(FORM_PREFIX.length) };
  if (Array.isArray(data.values)) return { actionId: id, value: data.values[0] };
  return { actionId: id };
}

const inputKind: Partial<Record<FieldSpec["kind"], number>> = { textarea: 2 };

/** Build the modal for a Form: one labelled input or select per field (max 5). */
export function formModal(formId: string, form: FormSpec): DiscordModal {
  const components = form.fields.slice(0, 5).map((f) => {
    const label = f.label.slice(0, 45) || f.target;
    if ((f.kind === "select" || f.kind === "multiselect") && f.options?.length) {
      return {
        type: 18,
        label,
        component: {
          type: 3,
          custom_id: f.target,
          ...(f.kind === "multiselect" ? { max_values: Math.min(25, f.options.length) } : {}),
          options: f.options.slice(0, 25).map((o) => ({
            label: o.label.slice(0, 100),
            value: o.value.slice(0, 100),
            ...(o.value === f.initial ? { default: true } : {}),
          })),
        },
      };
    }
    const initial = f.initial == null || f.initial === "" ? undefined : String(f.initial);
    return {
      type: 18,
      label,
      ...(f.kind === "number" ? { description: "A number" } : {}),
      component: {
        type: 4,
        custom_id: f.target,
        style: inputKind[f.kind] ?? 1,
        required: false,
        ...(initial !== undefined ? { value: initial.slice(0, 4000) } : {}),
      },
    };
  });
  return {
    custom_id: `${FORM_PREFIX}${formId}`.slice(0, 100),
    title: (form.title || "Form").slice(0, 45),
    components,
  };
}

/**
 * Normalize a MODAL_SUBMIT interaction's `data` into a form submit. Pass the
 * form spec (from RenderResult.forms) to coerce number fields.
 */
export function decodeModalSubmit(
  data: { custom_id: string; components?: any[] },
  form?: FormSpec,
): Interaction {
  const formId = (data.custom_id ?? "").replace(FORM_PREFIX, "");
  const patch: Snapshot = {};
  const kinds = new Map((form?.fields ?? []).map((f) => [f.target, f.kind]));
  const visit = (c: any) => {
    if (!c || typeof c !== "object") return;
    if (c.custom_id && ("value" in c || Array.isArray(c.values))) {
      const kind = kinds.get(c.custom_id);
      let v: unknown = Array.isArray(c.values)
        ? kind === "multiselect"
          ? c.values
          : c.values[0]
        : c.value;
      if (kind === "number" && typeof v === "string") {
        const n = Number(v.replace(/[,_\s]/g, ""));
        v = Number.isFinite(n) ? n : v;
      }
      patch[c.custom_id] = v;
    }
    if (c.component) visit(c.component);
    for (const child of c.components ?? []) visit(child);
  };
  for (const c of data.components ?? []) visit(c);
  return { actionId: formId, patch };
}
