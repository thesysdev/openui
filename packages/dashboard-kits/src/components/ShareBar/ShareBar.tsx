import clsx from "clsx";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { formatPercent } from "../../core/format";
import type { Item, ValueFormat } from "../../core/schemas";
import {
  useChartHover,
  useContainerSize,
  useIsomorphicLayoutEffect,
  useKitPalette,
} from "../../hooks";
import { ALL } from "../BarList";
import { ChartTooltip } from "../charts/shared";
import { springPresets, useDataMorph } from "../charts/shared/spring";
import { formatValue } from "../charts/utils/format";
import { segmentPath, shareAt, shareSpans } from "./shareGeometry";

export interface ShareBarProps {
  /** Up to six parts of a whole, in display order. */
  items: Item[];
  format?: ValueFormat;
  /** The current filter value, when parts filter the dashboard. */
  selected?: string;
  /**
   * Make parts with a filter key selectable: called with the part's key, or
   * with "all" to show every part again.
   */
  onSelect?: (key: string) => void;
}

const BAR = 14;

/** A faded version of a slot color, for the parts a selection is not showing. */
const fade = (color: string) => `color-mix(in srgb, ${color} 30%, var(--kit-card))`;

/**
 * Part-to-whole: the total, one segmented bar on a linear scale, and a legend
 * of each part's value and share. Hovering a segment or its legend row brings
 * that part forward (the others step back) and reads it out in the shared
 * tooltip; arrow keys walk the parts. Parts can drive a dashboard filter from
 * the bar or the legend: the chosen part keeps its color while the others
 * fade, and "Show all" clears it. Segments grow in from the left on mount,
 * glide to new shares on the data morph spring, and snap on resize.
 */
export function ShareBar({ items: allItems, format, selected, onSelect }: ShareBarProps) {
  const items = useMemo(() => allItems.slice(0, 6), [allItems]);
  const total = items.reduce((a, i) => a + i.value, 0) || 1;
  const active = onSelect != null && selected != null && selected !== ALL && selected !== "";
  const picked = active ? items.find((i) => i.key === selected) : undefined;
  // Parts take the theme's chart palette, as OpenUI's own part-to-whole charts do.
  const palette = useKitPalette(items.length, "pieChartPalette");
  const colors = items.map((item, k) => {
    const color = palette[k]!;
    return picked && item !== picked ? fade(color) : color;
  });

  const [frameRef, size] = useContainerSize<HTMLDivElement>(320, BAR);
  const width = Math.max(1, size.width);
  const values = useMemo(() => items.map((i) => i.value), [items]);
  const spans = useMemo(() => shareSpans(values, width), [values, width]);
  const hover = useChartHover(items.length);
  const findIndex = useCallback((px: number) => shareAt(spans, px), [spans]);
  const handlers = hover.createHandlers(findIndex);
  const hovered = hover.hoveredIndex;
  // The tooltip reads out the bar; a hovered legend row already shows its own figures.
  const [overBar, setOverBar] = useState(false);
  const select = (item: Item) => onSelect?.(item === picked ? ALL : item.key!);
  const selectable = (item: Item | undefined) => onSelect != null && item?.key != null;

  return (
    <div className="kit-share">
      <div className="kit-share__total">
        <span className="kit-share__total-value">
          {formatValue(picked?.value ?? total, format)}
        </span>
        <span className="kit-muted">{picked ? picked.name : "total"}</span>
        {picked && onSelect && (
          <button type="button" className="kit-share__clear" onClick={() => onSelect(ALL)}>
            Show all
          </button>
        )}
      </div>
      <div
        ref={frameRef}
        className={clsx(
          "kit-share__frame",
          selectable(hovered != null ? items[hovered] : undefined) && "kit-share__frame--pointer",
        )}
        tabIndex={0}
        role="img"
        aria-label={`${items.map((i) => `${i.name} ${formatPercent(i.value / total, 0)}`).join(", ")}. Use the arrow keys to read each part.`}
        {...handlers}
        onPointerEnter={() => setOverBar(true)}
        onPointerLeave={() => {
          setOverBar(false);
          handlers.onPointerLeave();
        }}
        onFocus={() => setOverBar(true)}
        onClick={() => {
          const item = hovered != null ? items[hovered] : undefined;
          if (item && selectable(item)) select(item);
        }}
      >
        <svg width={width} height={BAR} className="kit-share__svg">
          <ShareSegments
            spans={spans}
            colors={colors}
            hovered={hovered}
            layoutKey={`${width}:${items.length}`}
          />
        </svg>
        {overBar && hovered != null && items[hovered] && (
          <ChartTooltip
            x={spans[hovered * 2]! + spans[hovered * 2 + 1]! / 2}
            y={BAR + 6}
            width={width}
            title={items[hovered]!.name}
            rows={[
              {
                color: colors[hovered]!,
                name: `${formatPercent(items[hovered]!.value / total, 0)} of the total`,
                value: formatValue(items[hovered]!.value, format),
                kind: "rect",
              },
            ]}
          />
        )}
      </div>
      <ul
        className={clsx("kit-share__legend", hovered != null && "kit-share__legend--hovering")}
        onPointerLeave={() => hover.setHoveredIndex(null)}
      >
        {items.map((item, k) => {
          const row = (
            <>
              <i className="kit-key kit-key--rect" style={{ color: colors[k] }} aria-hidden />
              <span className="kit-share__name">{item.name}</span>
              <span className="kit-share__value">{formatValue(item.value, format)}</span>
              <span className="kit-share__pct">{formatPercent(item.value / total, 0)}</span>
            </>
          );
          const faded = picked && item !== picked ? "" : undefined;
          const rowProps = {
            "data-faded": faded,
            "data-active": hovered === k ? "" : undefined,
            onPointerEnter: () => hover.setHoveredIndex(k),
          };
          return selectable(item) ? (
            <li key={item.name} {...rowProps}>
              <button
                type="button"
                className="kit-share__row kit-share__button"
                aria-pressed={item === picked}
                title={`Filter the dashboard to ${item.name}`}
                onClick={() => select(item)}
              >
                {row}
              </button>
            </li>
          ) : (
            <li key={item.name} className="kit-share__row" {...rowProps}>
              {row}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The segments, driven by one spring data morph over their [x, width] spans.
 * A hover re-render only toggles classes.
 */
const ShareSegments = memo(function ShareSegments({
  spans,
  colors,
  hovered,
  layoutKey,
}: {
  spans: Float64Array;
  colors: string[];
  hovered: number | null;
  layoutKey: string;
}) {
  const k = spans.length / 2;
  const nonZero = Array.from({ length: k }, (_, i) => i).filter((i) => spans[i * 2 + 1]! > 0);
  const first = nonZero[0];
  const last = nonZero[nonZero.length - 1];
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const ends = useRef({ first, last });
  ends.current = { first, last };
  const aim = useDataMorph(springPresets.dataMorph, (animated) => {
    for (let i = 0; i < k; i++) {
      pathRefs.current[i]?.setAttribute(
        "d",
        segmentPath(
          animated[i * 2]!,
          animated[i * 2 + 1]!,
          BAR,
          i === ends.current.first,
          i === ends.current.last,
        ),
      );
    }
  });
  const lastLayout = useRef<string | null>(null);
  useIsomorphicLayoutEffect(() => {
    const snap = lastLayout.current !== layoutKey;
    lastLayout.current = layoutKey;
    aim(spans, snap);
  }, [spans, layoutKey, aim]);

  return (
    <g className={clsx("kit-share__segments", hovered != null && "kit-share__segments--hovering")}>
      {colors.map((color, i) => (
        <path
          key={i}
          ref={(el) => {
            pathRefs.current[i] = el;
          }}
          d={segmentPath(spans[i * 2]!, spans[i * 2 + 1]!, BAR, i === first, i === last)}
          fill={color}
          className={clsx("kit-share__segment", i === hovered && "kit-share__segment--active")}
        />
      ))}
    </g>
  );
});
