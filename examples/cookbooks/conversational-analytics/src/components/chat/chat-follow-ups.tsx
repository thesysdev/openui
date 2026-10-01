import { KerbArrow } from "./icons";
import "./chat.css";

/*
 * ChatFollowUps: what to ask next, under an answer. Rows with the kerb arrow
 * pointing on; hover paints the row red, slides the arrow and drops in the slash.
 */

export type ChatFollowUpsProps = {
  items: string[];
  label?: string | null;
  onPick?: (text: string) => void;
};

export function ChatFollowUps({ items, label = "Next lap", onPick }: ChatFollowUpsProps) {
  if (!items.length) return null;
  return (
    <div className="f1c f1c-followups">
      {label && <span className="f1c-label">{label}</span>}
      {items.map((item) => (
        <button key={item} type="button" className="f1c-row" onClick={() => onPick?.(item)}>
          <span className="f1c-row__arrow">
            <KerbArrow direction="right" size={11} />
          </span>
          {item}
        </button>
      ))}
    </div>
  );
}
