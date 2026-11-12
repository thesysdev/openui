"use client";
import { isReactiveAssign, useStateField } from "@openuidev/react-lang";
import type { Option } from "../../components/filters/options";

/**
 * A filter's state. Its name is the bound $variable, so the copies of one filter (the bar and
 * the phone sheet) share it. A filter with no $variable keeps a field of its own, named by its
 * kind, label and option values: the same in both copies, different from another filter's.
 */
export function useFilterField<T>(value: T, kind: string, label?: string, options?: Option[]) {
  const own = [kind, label ?? "", ...(Array.isArray(options) ? options : []).map((o) => o?.value)];
  return useStateField(isReactiveAssign(value) ? value.target : own.join(":"), value);
}
