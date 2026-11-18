/**
 * Teams payload normalizers. An Action.Submit arrives as one payload merging
 * the button's `data` object with every input value on the card (keyed by
 * input id = the bound $variable name) - Teams' batched-submit shape, which
 * maps 1:1 onto the engine's applyInteraction({ actionId, patch }).
 */

/** Split a submit payload into the action id and the $variable patch. */
export function decodeSubmit(value: Record<string, unknown> | undefined): {
  actionId: string;
  patch: Record<string, unknown>;
} {
  const { actionId, ...rest } = value ?? {};
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (!k.startsWith("$")) continue; // only bound-variable inputs
    // Adaptive Card inputs report strings; restore numbers for Input.Number values.
    patch[k] = typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
  }
  return { actionId: String(actionId ?? ""), patch };
}
