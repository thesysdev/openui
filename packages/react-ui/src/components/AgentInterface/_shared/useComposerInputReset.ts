import { useLayoutEffect, useRef, useState, type RefObject } from "react";

/** Retire a submitted composition's DOM node so its late input events cannot restore the draft. */
export function useComposerInputReset(inputRef: RefObject<HTMLTextAreaElement | null>) {
  const [inputKey, setInputKey] = useState(0);
  const hasComposition = useRef(false);
  const restoreFocus = useRef(false);

  useLayoutEffect(() => {
    if (restoreFocus.current) {
      restoreFocus.current = false;
      inputRef.current?.focus();
    }
  }, [inputKey, inputRef]);

  const onCompositionStart = () => {
    hasComposition.current = true;
  };

  const resetAfterSubmit = () => {
    if (!hasComposition.current) return;

    // Keep this flag until submission: the final input can follow compositionend.
    hasComposition.current = false;
    const input = inputRef.current;
    restoreFocus.current = !!input && input.ownerDocument.activeElement === input;
    setInputKey((key) => key + 1);
  };

  return { inputKey, onCompositionStart, resetAfterSubmit };
}
