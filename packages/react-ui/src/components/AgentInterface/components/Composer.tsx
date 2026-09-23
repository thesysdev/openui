import { useThread, useThreadList } from "@openuidev/react-headless";
import clsx from "clsx";
import { ArrowUp, Square } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useLayoutContext } from "../../../context/LayoutContext";
import { useAutoFocus } from "../../../hooks/useAutoFocus";
import { useComposerState } from "../../../hooks/useComposerState";
import { IconButton } from "../../IconButton";
import { shouldSubmitOnEnter } from "../_shared/utils/composerKeyboard";

export interface ComposerProps {
  className?: string;
  placeholder?: string;
}

export const Composer = ({ className, placeholder = "Type your query here" }: ComposerProps) => {
  const { textContent, setTextContent } = useComposerState();
  const processMessage = useThread((s) => s.processMessage);
  const cancelMessage = useThread((s) => s.cancelMessage);
  const isRunning = useThread((s) => s.isRunning);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [hasInputOverflowTop, setHasInputOverflowTop] = useState(false);
  const [hasInputOverflowBottom, setHasInputOverflowBottom] = useState(false);
  const selectedThreadId = useThreadList((s) => s.selectedThreadId);
  const { layout } = useLayoutContext();

  useAutoFocus(inputRef, {
    enabled: layout !== "mobile" && !isLoadingMessages,
    focusKey: selectedThreadId,
  });

  const updateInputOverflow = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    const maxScrollTop = input.scrollHeight - input.clientHeight;

    setHasInputOverflowTop(maxScrollTop > 0 && input.scrollTop > 0);
    setHasInputOverflowBottom(maxScrollTop > 0 && input.scrollTop < maxScrollTop - 1);
  }, []);

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
    const input = inputRef.current;
    if (!input) return;

    // Reset to 0 (not "auto") so scrollHeight reflects content, not container
    input.style.height = "0px";
    input.style.height = `${Math.max(input.scrollHeight, 24)}px`;
    updateInputOverflow();
  }, [textContent, updateInputOverflow]);

  return (
    <div
      className={clsx("openui-agent-thread-composer", className)}
      data-drafting={textContent.length > 0 || undefined}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("button, a, [role='button']")) {
          inputRef.current?.focus();
        }
      }}
    >
      <div
        className="openui-agent-thread-composer__input-wrapper"
        data-overflow-top={hasInputOverflowTop || undefined}
        data-overflow-bottom={hasInputOverflowBottom || undefined}
      >
        <textarea
          ref={inputRef}
          value={textContent}
          autoFocus
          onChange={(e) => setTextContent(e.target.value)}
          onScroll={updateInputOverflow}
          className="openui-agent-thread-composer__input"
          placeholder={placeholder}
          rows={1}
          onKeyDown={(e) => {
            if (shouldSubmitOnEnter(e)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <div className="openui-agent-thread-composer__action-bar">
          <IconButton
            onClick={isRunning ? cancelMessage : handleSubmit}
            icon={isRunning ? <Square size="1em" fill="currentColor" /> : <ArrowUp size="1em" />}
            size="extra-small"
            variant="primary"
            aria-label={isRunning ? "Cancel message" : "Send message"}
            className="openui-agent-thread-composer__submit-button"
          />
        </div>
      </div>
    </div>
  );
};

export default Composer;
