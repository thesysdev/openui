// Small shared helpers for building Block Kit values.
export const asText = (v: unknown) => (v == null ? "" : String(v));

/** A Block Kit option object from an Option element. */
export const optionObj = (o: any) => ({
  text: { type: "plain_text", text: asText(o?.props?.label) },
  value: asText(o?.props?.value),
});

export const placeholder = (name: unknown, fallback: string) => ({
  type: "plain_text",
  text: asText(name) || fallback,
});
