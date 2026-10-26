import { useId } from "react";
import { HoverTip } from "../KitLayer";

export interface DataStatusItem {
  label: string;
  value: string;
  tone: "good" | "warn" | "info";
  detail?: string;
}

export interface DataStatusProps {
  items: DataStatusItem[];
}

/**
 * Whether the numbers can be trusted right now: how fresh the data is, days
 * that were restated, what was filtered out, and any tracking breaks, as a
 * row of chips with the detail on hover or keyboard focus.
 */
export function DataStatus({ items }: DataStatusProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <ul className="kit-data-status" aria-label="Data status">
      {items.map((item, i) => {
        const tip = item.detail ? `data-status-${id}-${i}` : undefined;
        return (
          <li key={item.label} className="kit-def-host">
            <span
              className={`kit-data-status__chip kit-data-status__chip--${item.tone}`}
              tabIndex={tip ? 0 : undefined}
              aria-describedby={tip}
            >
              <i className="kit-data-status__dot" aria-hidden />
              <span className="kit-data-status__label">{item.label}</span> {item.value}
            </span>
            {tip && <HoverTip id={tip}>{item.detail}</HoverTip>}
          </li>
        );
      })}
    </ul>
  );
}
