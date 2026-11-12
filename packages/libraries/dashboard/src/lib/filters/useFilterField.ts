"use client";
import { isReactiveAssign, useStateField } from "@openuidev/react-lang";

/**
 * A filter's state. Its name is the bound $variable, so the copies of one filter (the bar and
 * the phone sheet) share it; a filter with no $variable keeps a field of its own under `fallback`.
 */
export function useFilterField<T>(value: T, fallback: string) {
  return useStateField(isReactiveAssign(value) ? value.target : fallback, value);
}
