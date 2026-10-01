import "./chat.css";

/*
 * ChatJumpToLatest: shown while the thread runs on below the fold. A round carbon
 * button with a chevron down; red on hover.
 */

export function ChatJumpToLatest({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" className="f1c f1c-latest" onClick={onClick} aria-label="Scroll to the latest message">
      <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden>
        <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
      </svg>
    </button>
  );
}
