import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from "react";
import { isCommitEnter, isStaleComposition, shouldSubmitOnEnter } from "./composerKeyboard";

export interface ComposerCompositionOptions {
  textContent: string;
  setTextContent: (value: string) => void;
  processMessage: (message: { role: "user"; content: string }) => void;
  isRunning: boolean;
  isLoadingMessages: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  /** When this changes (e.g. thread switch) stuck composition flags are cleared. */
  resetKey?: unknown;
}

const isModifierKey = (key: string) =>
  key === "Shift" || key === "Control" || key === "Alt" || key === "Meta" || key === "CapsLock";

/** Trailing-tail silence after a commit Enter before a new Win+H session may append. */
export const STOP_WINDOW_MS = 1500;

/**
 * Shared voice-typing / IME composition guard for both built-in composers.
 *
 * Contract: first `Enter` commits exactly one clean copy to the draft and
 * stops the session; trailing dictation while stopped lands nowhere; second
 * `Enter` (or Send) submits that single copy. Send clicks send immediately
 * (the plain-button click blurs first, so the browser commits before the
 * click handler runs). Late pre-submit echoes are swallowed via the submit
 * epoch so the cleared draft stays clear across rounds. The stopped state
 * expires after `STOP_WINDOW_MS` so a deliberate new Win+H session appends
 * after the committed text instead of being silenced forever.
 */
export const useComposerComposition = ({
  textContent,
  setTextContent,
  processMessage,
  isRunning,
  isLoadingMessages,
  textareaRef,
  resetKey,
}: ComposerCompositionOptions) => {
  const isComposingRef = useRef(false);
  const submitGenRef = useRef(0);
  const activeCompositionSubmitGenRef = useRef<number | null>(null);
  const commitPendingRef = useRef(false);
  const stoppedRef = useRef(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStopTimer = () => {
    if (stopTimerRef.current !== null) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const armStopped = () => {
    stoppedRef.current = true;
    clearStopTimer();
    stopTimerRef.current = setTimeout(() => {
      stopTimerRef.current = null;
      stoppedRef.current = false;
      if (commitPendingRef.current) {
        if (isComposingRef.current) {
          // The commit Enter never produced a `compositionend` (voice session
          // aborted mid-dictation). Flush the best snapshot once so the draft
          // holds one copy and later input is never stuck behind pending.
          const committed = textareaRef.current?.value ?? "";
          commitPendingRef.current = false;
          isComposingRef.current = false;
          activeCompositionSubmitGenRef.current = null;
          if (committed !== "") {
            setTextContent(committed);
          }
        } else {
          commitPendingRef.current = false;
        }
      }
    }, STOP_WINDOW_MS);
  };

  useEffect(() => {
    isComposingRef.current = false;
    activeCompositionSubmitGenRef.current = null;
    commitPendingRef.current = false;
    stoppedRef.current = false;
    clearStopTimer();
  }, [resetKey]);

  useEffect(
    () => () => {
      clearStopTimer();
    },
    [],
  );

  const submitSnapshot = (snapshot: string) => {
    if (!snapshot.trim() || isRunning || isLoadingMessages) {
      return false;
    }

    processMessage({
      role: "user",
      content: snapshot,
    });

    setTextContent("");
    submitGenRef.current += 1;
    isComposingRef.current = false;
    activeCompositionSubmitGenRef.current = null;
    commitPendingRef.current = false;
    stoppedRef.current = false;
    clearStopTimer();
    textareaRef.current?.blur();
    return true;
  };

  const handleSubmit = () => {
    stoppedRef.current = false;
    commitPendingRef.current = false;
    clearStopTimer();
    submitSnapshot(textContent);
  };

  const handleChange = (value: string) => {
    if (commitPendingRef.current) {
      return;
    }
    if (stoppedRef.current) {
      return;
    }
    if (isStaleComposition(activeCompositionSubmitGenRef.current, submitGenRef.current)) {
      if (textContent !== "") {
        setTextContent("");
      }
      return;
    }
    setTextContent(value);
  };

  const handleCompositionStart = () => {
    if (stoppedRef.current) {
      return;
    }
    isComposingRef.current = true;
    activeCompositionSubmitGenRef.current = submitGenRef.current;
  };

  const handleCompositionEnd = (e: { currentTarget: HTMLTextAreaElement }) => {
    if (commitPendingRef.current) {
      commitPendingRef.current = false;
      isComposingRef.current = false;
      activeCompositionSubmitGenRef.current = null;
      setTextContent(e.currentTarget.value);
      return;
    }
    if (stoppedRef.current) {
      isComposingRef.current = false;
      activeCompositionSubmitGenRef.current = null;
      return;
    }
    if (isStaleComposition(activeCompositionSubmitGenRef.current, submitGenRef.current)) {
      if (textContent !== "") {
        setTextContent("");
      }
    }
    isComposingRef.current = false;
    activeCompositionSubmitGenRef.current = null;
  };

  const handleBlur = () => {
    isComposingRef.current = false;
  };

  const handleFocus = () => {
    stoppedRef.current = false;
    if (!isComposingRef.current) {
      commitPendingRef.current = false;
    }
    clearStopTimer();
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      isComposingRef.current = false;
      activeCompositionSubmitGenRef.current = null;
      commitPendingRef.current = false;
      stoppedRef.current = false;
      clearStopTimer();
      return;
    }
    if (stoppedRef.current && !isModifierKey(e.key)) {
      if (e.key === "Enter" && !e.shiftKey) {
        stoppedRef.current = false;
        commitPendingRef.current = false;
        clearStopTimer();
        if (shouldSubmitOnEnter(e, false)) {
          e.preventDefault();
          submitSnapshot(textContent);
        }
        return;
      }
      stoppedRef.current = false;
      commitPendingRef.current = false;
      clearStopTimer();
    }
    if (e.key === "Enter" && !e.shiftKey && isCommitEnter(e, isComposingRef.current)) {
      commitPendingRef.current = true;
      armStopped();
      return;
    }
    if (shouldSubmitOnEnter(e, isComposingRef.current)) {
      e.preventDefault();
      submitSnapshot(textContent);
    }
  };

  return {
    handleSubmit,
    handleChange,
    handleCompositionStart,
    handleCompositionEnd,
    handleBlur,
    handleFocus,
    handleKeyDown,
  };
};
