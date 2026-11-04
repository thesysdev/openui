import { Ref, RefObject } from "react";

/**
 * Assigns a value to a ref.
 * Handles both callback refs and ref objects safely.
 *
 * @template T - The type of the ref value
 * @param ref - The ref to assign the value to (can be callback, ref object, or null)
 * @param value - The value to assign
 */
export const assignRef = <T = unknown>(ref: Ref<T> | null, value: T | null): void => {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    (ref as RefObject<T | null>).current = value;
  }
};
