"use client";
import { geoAlbersUsa, geoNaturalEarth1, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { useId, useMemo, useState } from "react";
import { MUTED_COLOR, sequentialColor } from "../../../shared/colors";
import { formatValue, type ValueFormat } from "../../../shared/format";
import { useWidth } from "../../../shared/hooks";
import { toNumbers, toStrings } from "../../../shared/values";
import { RampKey } from "../../shared/RampKey";
import { RankedList } from "../../shared/RankedList";
import { useRowHover } from "../../shared/RowHover";
import { Empty } from "../../shared/States";
import { TooltipCard } from "../../shared/TooltipCard";
import { ViewSwitch } from "../../shared/ViewSwitch";
import { displayName, MapFailed, normalize, shapeName, useShapes, WIDTH } from "../mapHelpers";
type GeoView = "count" | "total";
const GEO_VIEWS: { value: GeoView; label: string }[] = [
  { value: "count", label: "Count" },
  { value: "total", label: "% of total" },
];

export interface GeoMapProps {
  region: "world" | "us";
  labels: string[];
  values: number[];
  format?: ValueFormat;
  previous?: number[];
  goodWhen?: "up" | "down" | "neutral";
  limit?: number;
  view?: "count" | "total";
}
// ---------- GeoMap ----------
export function GeoMap(props: GeoMapProps) {
  const region = props.region === "us" ? "us" : "world";
  const { shapes, failed } = useShapes(region);
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null);
  // Hooks stay above the early return: a map can render empty mid-stream, then fill.
  const [desc, setDesc] = useState(true);
  const [viewChoice, setView] = useState<GeoView | null>(null);
  const view: GeoView = viewChoice ?? props.view ?? "count";
  const listHover = useRowHover();
  // The dot texture is drawn in screen pixels, as on every bar, so it needs the map's drawn width.
  const [mapRef, mapWidth] = useWidth();
  const texId = `geo${useId().replace(/:/g, "")}`;

  const labels = toStrings(props.labels);
  // Keyed on the props themselves: toStrings and toNumbers return new arrays every render.
  const byName = useMemo(() => {
    const values = toNumbers(props.values);
    const previous = toNumbers(props.previous);
    const map = new Map<string, { label: string; value: number; previous: number | null }>();
    toStrings(props.labels).forEach((label, i) => {
      const value = values[i];
      if (typeof value === "number")
        map.set(normalize(shapeName(label, region)), {
          label,
          value,
          previous: previous[i] ?? null,
        });
    });
    return map;
  }, [props.labels, props.values, props.previous, region]);

  const height = region === "us" ? 440 : 380;
  const paths = useMemo(() => {
    if (!shapes) return [];
    const collection = { type: "FeatureCollection", features: shapes } as FeatureCollection<
      Geometry,
      { name: string }
    >;
    const projection = (region === "us" ? geoAlbersUsa() : geoNaturalEarth1()).fitSize(
      [WIDTH, height],
      collection,
    );
    const path = geoPath(projection);
    return shapes.map((shape) => ({ name: shape.properties.name, d: path(shape) ?? "" }));
  }, [shapes, region, height]);

  const mapped = new Set(paths.map((shape) => normalize(shape.name)));
  if (!labels.length) return <Empty />;
  const known = [...byName.values()];
  // Count, or each region's share of the whole (and of the previous whole, for its change).
  const switchable = known.every((entry) => entry.value >= 0);
  const shown: GeoView = switchable ? view : "count";
  const total = known.reduce((sum, entry) => sum + entry.value, 0) || 1;
  const prevTotal = known.reduce((sum, entry) => sum + (entry.previous ?? 0), 0) || 1;
  const read = (entry: { value: number }) =>
    shown === "total" ? (entry.value / total) * 100 : entry.value;
  const readPrev = (entry: { previous: number | null }) =>
    entry.previous === null
      ? null
      : shown === "total"
        ? (entry.previous / prevTotal) * 100
        : entry.previous;
  const format = shown === "total" ? "percent" : props.format;
  const min = Math.min(...known.map(read));
  const max = Math.max(...known.map(read));
  // Every region, as on the Leaderboard; limit keeps the top N only when a program sets it.
  const top = [...known].sort((a, b) => b.value - a.value).slice(0, props.limit ?? undefined);
  const hovered = hover ? byName.get(normalize(hover.name)) : undefined;
  // Linked hover: a hovered country lights its list row, a hovered row outlines its country.
  const keyOf = (label: string) => normalize(shapeName(label, region));
  const activeKey = hover
    ? normalize(hover.name)
    : listHover.active !== null
      ? keyOf(listHover.active)
      : null;
  const tip = (entry: { label: string; value: number; previous: number | null }) => (
    <TooltipCard
      title={displayName(entry.label, region)}
      format={format}
      goodWhen={props.goodWhen}
      rows={[
        {
          // "Now" only reads against a Previous row; alone, it is just the value.
          name: entry.previous !== null ? "Now" : "Value",
          color: "var(--openui-dashboard-series-1)",
          value: read(entry),
          previous: readPrev(entry),
        },
        ...(entry.previous !== null
          ? [{ name: "Previous", color: MUTED_COLOR, value: readPrev(entry) }]
          : []),
        ...(shown === "count" && switchable
          ? [
              {
                name: "Share of total",
                color: "transparent",
                value: (entry.value / total) * 100,
                format: "percent" as const,
                mark: <span className="openui-dashboard-tip-dot" />,
              },
            ]
          : []),
      ]}
    />
  );
  const activePath = activeKey
    ? paths.find((shape) => normalize(shape.name) === activeKey)
    : undefined;

  const texScale = mapWidth ? WIDTH / mapWidth : 1;
  return (
    <div className="openui-dashboard-geo">
      {switchable ? (
        <ViewSwitch
          label="Show regions as"
          prefix="Show"
          options={GEO_VIEWS}
          value={view}
          onChange={setView}
        />
      ) : null}
      <div className="openui-dashboard-geo-body">
        {/* The map column: the map centred in the spare height, its colour key at the bottom, so the list beside it runs the card's full height. */}
        <div className="openui-dashboard-geo-map">
          <div
            ref={mapRef}
            className="openui-dashboard-geo-stage"
            onMouseLeave={() => setHover(null)}
          >
            {shapes ? (
              <svg
                viewBox={`0 0 ${WIDTH} ${height}`}
                style={{ width: "100%", height: "auto", display: "block" }}
                role="img"
                aria-label="Map"
              >
                {/* The bars' dot texture (6px, 45°, ink at --openui-dashboard-bar-ink), in screen pixels whatever the map's scale. */}
                <defs>
                  <pattern
                    id={`${texId}-dots`}
                    width={6 * texScale}
                    height={6 * texScale}
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <circle
                      cx={1.8 * texScale}
                      cy={1.8 * texScale}
                      r={0.8 * texScale}
                      fill="black"
                      style={{ opacity: "var(--openui-dashboard-bar-ink)" }}
                    />
                  </pattern>
                </defs>
                {paths.map((shape) => {
                  const entry = byName.get(normalize(shape.name));
                  const fill = entry
                    ? sequentialColor(read(entry), min, max).background
                    : "var(--openui-dashboard-map-land)";
                  return (
                    <path
                      key={shape.name}
                      d={shape.d}
                      fill={fill}
                      stroke="var(--openui-dashboard-surface)"
                      strokeWidth={0.75}
                      style={{
                        transition: "opacity 120ms",
                        opacity: activeKey && activeKey !== normalize(shape.name) ? 0.75 : 1,
                      }}
                      onMouseMove={(event) => {
                        const box = (
                          event.currentTarget.ownerSVGElement?.parentElement ?? event.currentTarget
                        ).getBoundingClientRect();
                        setHover({
                          name: shape.name,
                          x: event.clientX - box.left,
                          y: event.clientY - box.top,
                        });
                      }}
                    />
                  );
                })}
                {/* Regions with data carry the dot texture over their fill, as every bar does; regions without data stay plain. */}
                <g pointerEvents="none">
                  {paths.map((shape) =>
                    byName.has(normalize(shape.name)) ? (
                      <path
                        key={shape.name}
                        d={shape.d}
                        fill={`url(#${texId}-dots)`}
                        style={{
                          transition: "opacity 120ms",
                          opacity: activeKey && activeKey !== normalize(shape.name) ? 0.75 : 1,
                        }}
                      />
                    ) : null,
                  )}
                </g>
                {/* The active country outlined in ink on top, whether it's hovered on the map or in the list. */}
                {activePath ? (
                  <path
                    d={activePath.d}
                    fill="none"
                    stroke="var(--openui-dashboard-ink)"
                    strokeOpacity={0.35}
                    strokeWidth={0.75}
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />
                ) : null}
              </svg>
            ) : failed ? (
              <MapFailed />
            ) : (
              <div className="openui-dashboard-skel" style={{ height: 280 }} role="status">
                <span className="openui-dashboard-sr-only">Loading map</span>
              </div>
            )}
            {hover ? (
              <div
                style={{
                  position: "absolute",
                  left: hover.x + 12,
                  top: hover.y + 12,
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              >
                {hovered ? (
                  tip(hovered)
                ) : (
                  <TooltipCard
                    title={hover.name}
                    rows={[
                      { name: "No data", color: "var(--openui-dashboard-map-land)", value: null },
                    ]}
                  />
                )}
              </div>
            ) : null}
          </div>
          <RampKey
            className="openui-dashboard-geo-legend"
            low={formatValue(min, format, { axis: true })}
            high={formatValue(max, format, { axis: true })}
            ramp="seq"
          />
        </div>
        {/* The sort flips the reading order of the same top entries; a hovered row outlines its region. */}
        <RankedList
          side
          title={
            props.limit
              ? region === "us"
                ? "Top states"
                : "Top countries"
              : region === "us"
                ? "States"
                : "Countries"
          }
          hover={listHover}
          items={top.map((entry) => ({
            key: entry.label,
            name: (
              <>
                {displayName(entry.label, region)}
                {shapes && !mapped.has(keyOf(entry.label)) ? (
                  <span
                    style={{
                      marginLeft: 6,
                      fontWeight: 400,
                      fontSize: 11,
                      color: "var(--openui-dashboard-ink-muted)",
                    }}
                  >
                    not on map
                  </span>
                ) : null}
              </>
            ),
            value: read(entry),
            previous: readPrev(entry),
            linked: activeKey === keyOf(entry.label),
            tip: () => tip(entry),
          }))}
          max={max}
          format={format}
          goodWhen={props.goodWhen}
          desc={desc}
          onSort={() => setDesc((value) => !value)}
          watch={shown}
        />
      </div>
    </div>
  );
}
