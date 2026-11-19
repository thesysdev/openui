import { useCallback } from "react";
import { assignRef } from "../internalUtils/ref";

type RefType<T> = React.Ref<T> | React.RefObject<T> | React.ForwardedRef<T>;

/**
 * Custom hook to merge multiple refs into a single ref callback.
 *
 * @template T - The type of element the ref will reference
 * @param refs - Any number of refs or ref functions to merge
 * @returns A callback ref that assigns the value to all provided refs
 */
export const useMultipleRefs = <T = HTMLElement>(...refs: Array<RefType<T>>) => {
  return useCallback(
    (value: T | null) => {
      refs.forEach((ref) => {
        assignRef(ref, value);
      });
    },
    [refs],
  );
};
