import clsx from "clsx";
import { names, styles } from "./map.styles";

export type RouteKind = "none" | "street" | "overview" | "loading";

const ROUTE_STATUS: Record<RouteKind, string> = { street: "Street route loaded.", overview: "Street routing unavailable. Showing direct connections.", loading: "Street route loading.", none: "" };

type Props = {
  categories: string[];
  group: string;
  onGroup: (group: string) => void;
  onRecenter: () => void;
  infoOpen: boolean;
  onToggleInfo: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  routeKind: RouteKind;
  mapError: boolean;
};

/** The map's own controls and notes, drawn over its surface. */
export function MapControls({ categories, group, onGroup, onRecenter, infoOpen, onToggleInfo, expanded, onToggleExpand, routeKind, mapError }: Props) {
  const routeNote = routeKind === "street" ? "The line follows streets (OSRM / OpenStreetMap, driving profile); it is an overview, not turn-by-turn directions."
    : routeKind === "none" ? "" : "The line joins the places in order. Street routing is loading or unavailable.";
  return (
    <>
      <div className={clsx(styles.topLeft, names.topLeft)}>
        {categories.length > 1 && (
          <label className={clsx(styles.pill, names.pill, styles.filter, names.filter)}>
            <select className={clsx(styles.select, names.select)} aria-label="Filter places" value={group} onChange={(event) => onGroup(event.target.value)}>
              <option value="all">All places</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <svg className={clsx(styles.filterIcon, names.filterIcon)} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
          </label>
        )}
        <button className={clsx(styles.pill, names.pill, styles.recenter, names.recenter)} type="button" aria-label="Show every place" onClick={onRecenter}><svg className={clsx(styles.recenterIcon, names.recenterIcon)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m4.5 4.5 15 5a1 1 0 0 1 0 1.9l-6.1 2-2 6.1a1 1 0 0 1-1.9 0l-5-15z"/></svg></button>
        <button className={clsx(styles.info, names.info)} type="button" aria-label="About this map" aria-expanded={infoOpen} onClick={onToggleInfo}><svg className={clsx(styles.infoIcon, names.infoIcon)} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M10 9v5"/><circle cx="10" cy="6.3" r=".6" fill="currentColor" stroke="none"/></svg></button>
      </div>
      <button className={clsx(styles.pill, names.pill, styles.expand, names.expand)} type="button" aria-expanded={expanded} onClick={onToggleExpand}>{expanded ? "Collapse" : "Expand"}<svg className={clsx(styles.expandIcon, names.expandIcon)} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 4h4v4M8 16H4v-4M16 12v4h-4M4 8V4h4"/></svg></button>
      {infoOpen && <div className={clsx(styles.note, names.note)}>Drag to explore and use + and − to zoom. Select a place to highlight it. {routeNote}</div>}
      {routeKind === "overview" && <div className={clsx(styles.overview, names.overview)}>Route overview</div>}
      <span className={clsx(styles.status, names.status)} role="status">{ROUTE_STATUS[routeKind]}</span>
      {mapError && <div className={clsx(styles.error, names.error)} role="status">Map tiles are temporarily unavailable. The places are still shown.</div>}
    </>
  );
}
