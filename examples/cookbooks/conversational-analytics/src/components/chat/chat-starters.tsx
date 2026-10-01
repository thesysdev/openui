import "./chat.css";

/*
 * ChatStarters: the suggested first questions, lined up like a starting grid.
 * Each row carries its grid slot (P1, P2…). Hover or focus paints the row red
 * and drops in the sidebar's slanted red slash, without moving the text.
 */

export type ChatStarter = { displayText: string; prompt: string };

export type ChatStartersProps = {
  starters: ChatStarter[];
  /** Small label above the rows. Pass null to hide it. */
  label?: string | null;
  onPick?: (prompt: string) => void;
};

export function ChatStarters({ starters, label = "Starting grid", onPick }: ChatStartersProps) {
  if (!starters.length) return null;
  return (
    <div className="f1c f1c-starters">
      {label && <span className="f1c-label">{label}</span>}
      {starters.map((s, i) => (
        <button key={s.prompt} type="button" className="f1c-row" onClick={() => onPick?.(s.prompt)}>
          <span className="f1c-grid-slot">P{i + 1}</span>
          {s.displayText}
        </button>
      ))}
    </div>
  );
}
