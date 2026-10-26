import { ChartKey, type ChartKeyShape } from "./ChartKey";

export interface LegendItem extends ChartKeyShape {
  name: string;
  color: string;
}

/** A reference drawn on the chart that is not a series: a goal line or a range. */
export interface LegendGuide {
  name: string;
  kind: "target" | "band";
}

/**
 * Series legend for the kit charts. With `onToggle` it is interactive: hovering
 * an item brings its series forward, a click pins it (see `useSeriesFocus`).
 * Guides — goal lines and benchmark ranges — are named here rather than on the
 * plot, so their labels can never collide with the data.
 */
export function ChartLegend({
  items,
  guides = [],
  active,
  pinned,
  onHover,
  onToggle,
}: {
  items: LegendItem[];
  guides?: LegendGuide[];
  active?: string | null;
  pinned?: string | null;
  onHover?: (name: string | null) => void;
  onToggle?: (name: string) => void;
}) {
  const guideItems = guides.map((guide) => (
    <span key={`guide-${guide.name}`} className="kit-legend__item kit-legend__guide">
      <i className={`kit-key kit-key--${guide.kind}`} aria-hidden />
      {guide.name}
    </span>
  ));
  if (!onToggle) {
    return (
      <div className="kit-legend" aria-hidden>
        {items.map((item) => (
          <span key={item.name} className="kit-legend__item">
            <ChartKey {...item} />
            {item.name}
          </span>
        ))}
        {guideItems}
      </div>
    );
  }
  return (
    <div className="kit-legend" role="group" aria-label="Series; select one to bring it forward">
      {items.map((item) => (
        <button
          key={item.name}
          type="button"
          className="kit-legend__item kit-legend__button"
          aria-pressed={pinned === item.name}
          data-faded={active != null && active !== item.name ? "" : undefined}
          onPointerEnter={() => onHover?.(item.name)}
          onPointerLeave={() => onHover?.(null)}
          onClick={() => onToggle(item.name)}
        >
          <ChartKey {...item} />
          {item.name}
        </button>
      ))}
      {guideItems}
    </div>
  );
}
