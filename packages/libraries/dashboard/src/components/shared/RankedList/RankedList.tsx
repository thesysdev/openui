"use client";

import { type ReactNode } from "react";
import { type ValueFormat } from "../../../shared/format";
import { columnFormatter, deltaDecimals } from "../../../shared/scales";
import { type GoodWhen } from "../DeltaBadge";
import { DeltaBadge } from "../DeltaBadge/DeltaBadge";
import { useRowHover } from "../RowHover/RowHover";
import { ScrollArea } from "../ScrollArea/ScrollArea";
import { SortToggle } from "../SortToggle/SortToggle";

export type RankedListProps = {
  hover: ReturnType<typeof useRowHover>;
  items: RankedItem[];
  /** The value a full-length bar stands for. */
  max: number;
  format?: ValueFormat | null;
  goodWhen?: GoodWhen | null;
  desc: boolean;
  onSort: () => void;
  /** Beside a map (openui-dashboard-geo-side) rather than filling its card (openui-dashboard-rank-panel). */
  side?: boolean;
  title?: string;
  /** Re-measure the scroll area when this changes too (the map's view). */
  watch?: unknown;
  /** Under the list, e.g. a note naming rows that couldn't be ranked. */
  children?: ReactNode;
};

/* ---------- Ranked list ---------- */

export type RankedItem = {
  /** The row's key, and the key its hover reports (the item's label). */
  key: string;
  /** What the row prints as its name: a display name, with any marker after it. */
  name: ReactNode;
  value: number;
  previous: number | null;
  /** The bar's colour when rows differ (a place's group); the series hue otherwise. */
  color?: string;
  /** Lit from elsewhere: the same item hovered on a linked map. */
  linked?: boolean;
  tip: () => ReactNode;
};

/**
 * The one ranked list (Leaderboard, and the lists beside GeoMap and PointMap): a header with the sort
 * toggle (and a title, beside a map), then each row's name, change and value over a textured bar, one
 * precision per column, scrolling inside the card once it outgrows it. Items come highest first; desc
 * false reads the same items lowest first. Pass the list's useRowHover, so a map can light its rows.
 */
export function RankedList({
  hover,
  items,
  max,
  format,
  goodWhen,
  desc,
  onSort,
  side,
  title,
  watch,
  children,
}: RankedListProps) {
  const valueText = columnFormatter(
    items.map((item) => item.value),
    format,
  );
  const changeDecimals = deltaDecimals(
    items.map((item) => ({ current: item.value, previous: item.previous })),
    format,
  );
  const ranked = desc ? items : [...items].reverse();
  return (
    <div
      ref={hover.ref}
      className={
        side
          ? "openui-dashboard-geo-side openui-dashboard-rows"
          : "openui-dashboard-rank-panel openui-dashboard-rows"
      }
    >
      <div className={side ? "openui-dashboard-geo-side-head" : "openui-dashboard-rank-head"}>
        {title ? (
          <span className="openui-dashboard-card-subtitle" style={{ margin: 0 }}>
            {title}
          </span>
        ) : null}
        <SortToggle desc={desc} onToggle={onSort} />
      </div>
      {/* Fills a taller card before it scrolls; never shorter than its rows (about 44px each), up to 340px. */}
      <ScrollArea
        maxHeight={340}
        fill={ranked.length * 44}
        label="Scroll the list"
        watch={`${ranked.length}-${desc}${watch === undefined ? "" : `-${watch}`}`}
      >
        <ol className="openui-dashboard-rank">
          {ranked.map((item) => (
            // Every value is printed; the tooltip adds the previous one behind the change.
            <li
              key={item.key}
              className="openui-dashboard-rank-row"
              {...hover.rowProps(item.key, item.tip)}
              data-linked={item.linked ? "" : undefined}
            >
              <div className="openui-dashboard-rank-top">
                <span className="openui-dashboard-rank-name">{item.name}</span>
                <span className="openui-dashboard-rank-value">
                  <DeltaBadge
                    current={item.value}
                    previous={item.previous}
                    format={format}
                    goodWhen={goodWhen}
                    inline
                    decimals={changeDecimals}
                  />
                  {valueText(item.value)}
                </span>
              </div>
              <div className="openui-dashboard-rank-track">
                <div
                  className="openui-dashboard-rank-fill openui-dashboard-tex-0"
                  style={{
                    width: `${max ? (item.value / max) * 100 : 0}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      </ScrollArea>
      {hover.tip}
      {children}
    </div>
  );
}
