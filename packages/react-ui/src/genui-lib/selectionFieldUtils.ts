export type SelectionType = "single" | "multiple";
export type SelectionDefaultValue = string | string[] | undefined;

const onlyStrings = (values: unknown[]) =>
  values.filter((value): value is string => typeof value === "string");

/** Resolves the stored form value (falling back to defaultValue) into a list of selected values. */
export function normalizeSelection(
  type: SelectionType,
  storedValue: unknown,
  defaultValue: SelectionDefaultValue,
): string[] {
  if (type === "single") {
    if (typeof storedValue === "string") {
      return storedValue ? [storedValue] : [];
    }
    if (Array.isArray(storedValue) && typeof storedValue[0] === "string") {
      return storedValue[0] ? [storedValue[0]] : [];
    }
    if (typeof defaultValue === "string") {
      return defaultValue ? [defaultValue] : [];
    }
    if (Array.isArray(defaultValue) && typeof defaultValue[0] === "string") {
      return defaultValue[0] ? [defaultValue[0]] : [];
    }
    return [];
  }

  if (Array.isArray(storedValue)) {
    return onlyStrings(storedValue);
  }
  if (typeof storedValue === "string") {
    return storedValue ? [storedValue] : [];
  }
  if (Array.isArray(defaultValue)) {
    return onlyStrings(defaultValue);
  }
  if (typeof defaultValue === "string") {
    return defaultValue ? [defaultValue] : [];
  }

  return [];
}

/** Shape of defaultValue as it should be written into form state (string for single, string[] for multiple). */
export function getStoredDefaultValue(
  type: SelectionType,
  defaultValue: SelectionDefaultValue,
): string | string[] | undefined {
  if (type === "single") {
    if (typeof defaultValue === "string") {
      return defaultValue || undefined;
    }
    if (Array.isArray(defaultValue) && typeof defaultValue[0] === "string") {
      return defaultValue[0] || undefined;
    }
    return undefined;
  }

  if (Array.isArray(defaultValue)) {
    return onlyStrings(defaultValue);
  }
  if (typeof defaultValue === "string") {
    return defaultValue ? [defaultValue] : [];
  }

  return undefined;
}

/** Toggles `itemValue` in `selection` according to the selection type. */
export function toggleSelection(
  type: SelectionType,
  selection: string[],
  itemValue: string,
): string[] {
  if (type === "single") {
    return selection[0] === itemValue ? [] : [itemValue];
  }
  return selection.includes(itemValue)
    ? selection.filter((value) => value !== itemValue)
    : [...selection, itemValue];
}
