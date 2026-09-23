import { useThread, useThreadList } from "@openuidev/react-headless";
import clsx from "clsx";
import { ArrowUp, Square } from "lucide-react";
import { RefObject, useLayoutEffect, useRef } from "react";
import { useLayoutContext } from "../../../context/LayoutContext";
import { useAutoFocus } from "../../../hooks/useAutoFocus";
import { useComposerState } from "../../../hooks/useComposerState";
import { IconButton } from "../../IconButton";
import { shouldSubmitOnEnter } from "../_shared/utils/composerKeyboard";

export interface DesktopWelcomeComposerProps {
  className?: string;
  placeholder?: string;
  /**
   * Controlled draft value. When set, the internal draft state is bypassed and
   * `onChange` receives every edit (including the clear on submit). Used by the
   * prefill-chips welcome, whose chips must write into the draft.
   */
  value?: string;
  onChange?: (value: string) => void;
  /**
   * Overrides the internal `data-drafting` computation (value non-empty). The
   * prefill-chips welcome passes `false` for chip-prefilled drafts so the
   * contextual starters below don't fade.
   */
  drafting?: boolean;
  /** Ref to the underlying textarea, for focus/caret placement by the owner. */
  inputRef?: RefObject<HTMLTextAreaElement | null>;
}

export const DesktopWelcomeComposer = ({
  className,
  placeholder = "Type your query here",
  value,
  onChange,
  drafting,
  inputRef,
}: DesktopWelcomeComposerProps) => {
  const internal = useComposerState();
  const isControlled = value !== undefined;
  const textContent = isControlled ? value : internal.textContent;
  const setTextContent = isControlled ? (onChange ?? (() => undefined)) : internal.setTextContent;
  const processMessage = useThread((s) => s.processMessage);
  const cancelMessage = useThread((s) => s.cancelMessage);
  const isRunning = useThread((s) => s.isRunning);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef ?? ownRef;
  const selectedThreadId = useThreadList((s) => s.selectedThreadId);
  const { layout } = useLayoutContext();

  useAutoFocus(textareaRef, {
    enabled: layout !== "mobile" && !isLoadingMessages,
    focusKey: selectedThreadId,
  });

  const handleSubmit = () => {
    if (!textContent.trim() || isRunning || isLoadingMessages) {
      return;
    }

    processMessage({
      role: "user",
      content: textContent,
    });

    setTextContent("");
  };

  useLayoutEffect(() => {
    const input = textareaRef.current;
    if (!input) return;

    // Reset to 0 (not "auto") so scrollHeight reflects content, not container
    input.style.height = "0px";
    input.style.height = `${Math.max(input.scrollHeight, 24)}px`;
  }, [textContent, textareaRef]);

  return (
    <div
      className={clsx("openui-agent-desktop-welcome-composer", className)}
      data-drafting={(drafting ?? textContent.length > 0) || undefined}
    >
      <textarea
        ref={textareaRef}
        value={textContent}
        onChange={(e) => setTextContent(e.target.value)}
        className="openui-agent-desktop-welcome-composer__input"
        placeholder={placeholder}
        rows={1}
        onKeyDown={(e) => {
          if (shouldSubmitOnEnter(e)) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="openui-agent-desktop-welcome-composer__action-bar">
        <IconButton
          onClick={isRunning ? cancelMessage : handleSubmit}
          disabled={!textContent.trim() && !isRunning}
          aria-label={isRunning ? "Cancel" : "Send"}
          icon={isRunning ? <Square size="1em" fill="currentColor" /> : <ArrowUp size="1em" />}
          size="extra-small"
          variant="primary"
          className="openui-agent-desktop-welcome-composer__submit-button"
        />
      </div>
    </div>
  );
};

export default DesktopWelcomeComposer;
