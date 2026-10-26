import { formatValue } from "../../charts/utils/format";
import { formatChange, formatPercent } from "../../core/format";
import type { Item, ValueFormat } from "../../core/schemas";

/** The filter value that means "no selection" for the kits' dashboard filters. */
export const ALL = "all";

export interface BarListProps {
  items: Item[];
  format?: ValueFormat;
  /** Show at most this many rows. "Other" always sorts last. Default 8. */
  limit?: number;
  /** Names the list when a card stacks it under another chart. */
  caption?: string;
  /** The current filter value, when rows filter the dashboard. */
  selected?: string;
  /**
   * Make rows with a filter key selectable: called with the row's key, or with
   * "all" when the selected row is selected again.
   */
  onSelect?: (key: string) => void;
}

const isOther = (name: string) => /^other\b/i.test(name);

/**
 * A ranked list of labeled horizontal bars with each value and its change or
 * share. Rows can drive a dashboard filter: the chosen row stays bright and
 * the rest fade.
 */
export function BarList({ items, format, limit = 8, caption, selected, onSelect }: BarListProps) {
  const rows = [...items]
    .sort((a, b) => Number(isOther(a.name)) - Number(isOther(b.name)) || b.value - a.value)
    .slice(0, limit);
  const max = Math.max(...rows.map((i) => i.value), 1);
  const active = onSelect != null && selected != null && selected !== ALL && selected !== "";
  const content = (item: Item, i: number) => (
    <>
      <span className="kit-barlist__track">
        <span
          className="kit-barlist__fill"
          style={{
            width: `${Math.max(2, (item.value / max) * 100)}%`,
            animationDelay: `${i * 45}ms`,
          }}
        />
        <span className="kit-barlist__name">{item.name}</span>
      </span>
      <span className="kit-barlist__value">{formatValue(item.value, format)}</span>
      <span className="kit-barlist__meta">
        {item.change != null ? (
          <span className={item.change >= 0 ? "kit-text-good" : "kit-text-bad"}>
            {formatChange(item.change)}
          </span>
        ) : item.share != null ? (
          formatPercent(item.share, 0)
        ) : null}
      </span>
    </>
  );
  const list = (
    <ul className="kit-barlist">
      {rows.map((item, i) =>
        onSelect && item.key ? (
          <li key={item.name} data-faded={active && item.key !== selected ? "" : undefined}>
            <button
              type="button"
              className="kit-barlist__row kit-barlist__button"
              aria-pressed={active && item.key === selected}
              title={`Filter the dashboard to ${item.name}`}
              onClick={() => onSelect(item.key === selected ? ALL : item.key!)}
            >
              {content(item, i)}
            </button>
          </li>
        ) : (
          <li
            key={item.name}
            className="kit-barlist__row"
            title={`${item.name}: ${formatValue(item.value, format)}`}
          >
            {content(item, i)}
          </li>
        ),
      )}
    </ul>
  );
  if (!caption) return list;
  return (
    <div className="kit-captioned">
      <p className="kit-caption">{caption}</p>
      {list}
    </div>
  );
}
