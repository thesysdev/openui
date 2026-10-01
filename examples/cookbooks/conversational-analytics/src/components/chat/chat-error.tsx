import { KerbArrow } from "./icons";
import "./chat.css";

/*
 * ChatError: the run stopped. A red-flag chip, what happened in plain words
 * and a slanted Restart key that turns red on hover.
 */

export type ChatErrorProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ChatError({
  title = "Session suspended",
  message = "The timing feed didn't answer. Nothing was lost; radio in again to restart.",
  onRetry,
  retryLabel = "Restart",
}: ChatErrorProps) {
  return (
    <div className="f1c f1c-error" role="alert">
      <span className="f1c-flag-chip">Red flag</span>
      <div>
        <p className="f1c-error__title">{title}</p>
        <p className="f1c-error__text">{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="f1c-slant-button" onClick={onRetry}>
          {retryLabel} <KerbArrow size={11} />
        </button>
      )}
    </div>
  );
}
