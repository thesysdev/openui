import type { ReactNode } from "react";
import "./chat.css";

/*
 * ChatAssistantMessage: the answer. Prose and any generated UI straight on the
 * page, with no masthead.
 * While streaming, a solid red slanted cursor rides the end of the text.
 */

export type ChatAssistantMessageProps = {
  /** Answer prose. Use <p> and <strong>; it gets the article type (17 / 28). */
  text?: ReactNode;
  /** Generated UI (a Table, a chart) rendered under the prose. */
  children?: ReactNode;
  streaming?: boolean;
};

export function ChatCursor() {
  return <span className="f1c-cursor" aria-hidden />;
}

export function ChatAssistantMessage({ text, children, streaming = false }: ChatAssistantMessageProps) {
  return (
    <div className="f1c f1c-answer" aria-busy={streaming || undefined}>
      {text != null && (
        <div className="f1c-prose">
          {text}
          {streaming && children == null && <ChatCursor />}
        </div>
      )}
      {children}
    </div>
  );
}
