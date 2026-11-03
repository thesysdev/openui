/** A short plain-text name for an element, from its rendered text, for action messages. */
export const textOf = (element: HTMLElement | null) =>
  (element?.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 120);

/** Coerce a prop to a string; null and undefined become "". */
export const str = (value: unknown) => (value == null ? "" : String(value));

/** A number for display: grouped, at most two decimals. */
export const numberText = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
};
