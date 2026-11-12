"use client";
import { geoAlbersUsa, geoNaturalEarth1, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { useMemo, useState } from "react";
import { MUTED_COLOR, seriesColor } from "../../../shared/colors";
import { formatValue, type ValueFormat } from "../../../shared/format";
import { placeLabels } from "../../../shared/labels";
import { toNumbers, toStrings } from "../../../shared/values";
import { Legend } from "../../shared/Legend";
import { PartNote } from "../../shared/PartNote";
import { PointLabels } from "../../shared/PointLabels";
import { RankedList } from "../../shared/RankedList";
import { useRowHover } from "../../shared/RowHover";
// Shared with Scatter, as in his library (relations.tsx).
import { dotFill, ScatterMark } from "../../shared/ScatterMark";
import { SrTable } from "../../shared/SrTable";
import { Empty } from "../../shared/States";
import { TooltipCard } from "../../shared/TooltipCard";
import { MapFailed, useShapes, WIDTH } from "../mapHelpers";

export interface PointMapProps {
  region: "world" | "us";
  labels: string[];
  lats: number[];
  lons: number[];
  values: number[];
  format?: ValueFormat;
  valueLabel?: string;
  groups?: string[];
  previous?: number[];
  goodWhen?: "up" | "down" | "neutral";
}
// ---------- PointMap: values at places ----------
export function PointMap(props: PointMapProps) {
  const region = props.region === "us" ? "us" : "world";
  const { shapes, failed } = useShapes(region);
  const [hover, setHover] = useState<number | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [desc, setDesc] = useState(true);
  const listHover = useRowHover();

  const labels = toStrings(props.labels);
  const lats = toNumbers(props.lats);
  const lons = toNumbers(props.lons);
  const values = toNumbers(props.values);
  const previous = toNumbers(props.previous);
  const groupOf = props.groups ? toStrings(props.groups) : null;
  const height = region === "us" ? 440 : 380;
  const projected = useMemo(() => {
    if (!shapes) return null;
    const collection = { type: "FeatureCollection", features: shapes } as FeatureCollection<
      Geometry,
      { name: string }
    >;
    const projection = (region === "us" ? geoAlbersUsa() : geoNaturalEarth1()).fitSize(
      [WIDTH, height],
      collection,
    );
    const path = geoPath(projection);
    return {
      land: shapes.map((shape) => ({ name: shape.properties.name, d: path(shape) ?? "" })),
      project: projection,
    };
  }, [shapes, region, height]);

  if (!labels.length) return <Empty />;
  const known = values.filter((v): v is number => v !== null && v > 0);
  const max = known.length ? Math.max(...known) : 1;
  // Area encodes value: radius grows with the square root.
  const radius = (value: number) => 3 + Math.sqrt(value / max) * 18;
  // Groups take a colour each, in first-seen order; past eight, the rest share a grey Other.
  const seen = groupOf ? [...new Set(groupOf.filter(Boolean))] : [];
  const groups = seen.length > 8 ? seen.slice(0, 7) : seen;
  const folded = seen.length > 8;
  const groupIndex = (i: number) => (groupOf ? groups.indexOf(groupOf[i] ?? "") : 0);
  const colorOf = (i: number) => (groupIndex(i) < 0 ? MUTED_COLOR : seriesColor(groupIndex(i))!);
  const places = labels
    .map((label, i) => {
      const lat = lats[i]!;
      const lon = lons[i]!;
      const value = values[i]!;
      if (lat === null || lon === null || value === null || !projected) return null;
      const at = projected.project([lon, lat]);
      const group = groupOf?.[i] ?? "";
      return at
        ? {
            label,
            value,
            previous: previous[i] ?? null,
            group: folded && !groups.includes(group) ? "Other" : group,
            x: at[0],
            y: at[1],
            i,
          }
        : null;
    })
    .filter(
      (
        point,
      ): point is {
        label: string;
        value: number;
        previous: number | null;
        group: string;
        x: number;
        y: number;
        i: number;
      } => point !== null,
    );
  // Places with a value but no position on this map (missing coordinates, or outside the US projection) are named, not dropped.
  const placedSet = new Set(places.map((point) => point.i));
  const unplaced = projected
    ? labels.filter((_, i) => values[i] !== null && !placedSet.has(i))
    : [];
  // Largest first, so small circles stay on top and hoverable.
  const points = [...places].sort((a, b) => b.value - a.value);
  const labelled = new Set(points.slice(0, 8).map((point) => point.i));
  // Hovering a dot, a list row or a legend key lights the same place (or group) everywhere.
  const listActive = listHover.active !== null ? labels.indexOf(listHover.active) : null;
  const active = hover ?? listActive;
  const lit = (point: { i: number; group: string }) =>
    active !== null
      ? active === point.i
      : activeGroup !== null
        ? point.group === activeGroup
        : true;
  const anyActive = active !== null || activeGroup !== null;
  const hovered = hover === null ? null : (points.find((point) => point.i === hover) ?? null);
  const name = props.valueLabel ?? "Value";
  const tip = (point: {
    label: string;
    value: number;
    previous: number | null;
    group: string;
    i: number;
  }) => (
    <TooltipCard
      title={point.group ? `${point.label} · ${point.group}` : point.label}
      format={props.format}
      goodWhen={props.goodWhen}
      rows={[
        { name, color: colorOf(point.i), value: point.value, previous: point.previous },
        ...(point.previous !== null
          ? [{ name: "Previous", color: MUTED_COLOR, value: point.previous }]
          : []),
      ]}
    />
  );
  // The size key: three dots at the smallest, middle and largest values, drawn like the map's.
  const sorted = [...known].sort((a, b) => a - b);
  const steps = sorted.length
    ? [...new Set([sorted[0]!, sorted[Math.floor(sorted.length / 2)]!, sorted[sorted.length - 1]!])]
    : [];

  return (
    <div className="openui-dashboard-geo">
      {groups.length ? (
        <Legend
          entries={[
            ...groups.map((group, g) => ({ name: group, color: seriesColor(g)! })),
            ...(folded ? [{ name: "Other", color: MUTED_COLOR }] : []),
          ]}
          onHover={setActiveGroup}
        />
      ) : null}
      <SrTable
        caption="Values by place"
        head={["Place", name]}
        rows={labels.map((label, i) => [label, formatValue(values[i], props.format)])}
      />
      <div className="openui-dashboard-geo-body">
        <div className="openui-dashboard-geo-map">
          <div className="openui-dashboard-geo-stage" onMouseLeave={() => setHover(null)}>
            {projected ? (
              <svg
                viewBox={`0 0 ${WIDTH} ${height}`}
                style={{ width: "100%", height: "auto", display: "block" }}
                role="img"
                aria-label="Map of values by place"
              >
                {projected.land.map((shape) => (
                  <path
                    key={shape.name}
                    d={shape.d}
                    fill="var(--openui-dashboard-map-land)"
                    stroke="var(--openui-dashboard-surface)"
                    strokeWidth={0.75}
                  />
                ))}
                {points.map((point) => {
                  const r = radius(point.value);
                  return (
                    <g
                      key={`${point.i}-${point.label}`}
                      onMouseEnter={() => setHover(point.i)}
                      style={{ transition: "opacity 150ms" }}
                    >
                      {/* Scatter's dot: fill fading with size, a subtle outline, a tiny centre; others fade to 35% on hover. */}
                      <ScatterMark
                        cx={point.x}
                        cy={point.y}
                        size={Math.PI * r * r}
                        fill={colorOf(point.i)}
                        fillOpacity={anyActive && !lit(point) ? 0.75 * 0.35 : 0.75}
                        type="circle"
                      />
                      {active === point.i ? (
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={r + 4}
                          fill="none"
                          stroke={colorOf(point.i)}
                          strokeOpacity={0.3}
                          strokeWidth={4}
                          pointerEvents="none"
                        />
                      ) : null}
                    </g>
                  );
                })}
                {/* The biggest places name themselves, on a surface halo, as Scatter's points do. */}
                {/* Names on the top 8 places, placed so none collide: bigger places first, a crowded one steps aside on a leader. */}
                <PointLabels
                  labels={placeLabels(
                    points
                      .filter((point) => labelled.has(point.i))
                      .map((point) => ({
                        key: point.i,
                        x: point.x,
                        y: point.y,
                        r: radius(point.value),
                        text: point.label,
                      })),
                    11,
                    { x: 0, y: 0, width: WIDTH, height },
                  )}
                  opacityOf={(key) =>
                    anyActive && !lit(points.find((point) => point.i === key)!) ? 0.35 : 1
                  }
                />
              </svg>
            ) : failed ? (
              <MapFailed />
            ) : (
              <div className="openui-dashboard-skel" style={{ height: 280 }} role="status">
                <span className="openui-dashboard-sr-only">Loading map</span>
              </div>
            )}
            {hovered ? (
              <div
                style={{
                  position: "absolute",
                  left: `${(hovered.x / WIDTH) * 100}%`,
                  top: `${(hovered.y / height) * 100}%`,
                  transform: "translate(12px, 12px)",
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              >
                {tip(hovered)}
              </div>
            ) : null}
          </div>
          {/* The size key under the map, where GeoMap keeps its colour key: the measure's name and three graduated dots. */}
          {steps.length ? (
            <div className="openui-dashboard-legend openui-dashboard-geo-legend">
              <span
                className="openui-dashboard-size-key"
                aria-label={`${name}: ${steps[0]} to ${steps[steps.length - 1]}`}
              >
                <span className="openui-dashboard-size-name">{name}</span>
                {steps.map((v) => {
                  const r = radius(v);
                  return (
                    <span key={v} className="openui-dashboard-size-step">
                      <span
                        className="openui-dashboard-size-dot"
                        style={{
                          width: r * 2,
                          height: r * 2,
                          ["--openui-dashboard-dot" as string]: groups.length
                            ? MUTED_COLOR
                            : seriesColor(0),
                          ["--openui-dashboard-dot-fill" as string]: `${Math.round(dotFill(Math.PI * r * r) * 100)}%`,
                        }}
                      />
                      {formatValue(v, props.format, { axis: true })}
                    </span>
                  );
                })}
              </span>
            </div>
          ) : null}
        </div>
        {/* The ranked list, as on GeoMap: every place by value, linked to the map both ways. */}
        <RankedList
          side
          title="Places"
          hover={listHover}
          items={points.map((point) => ({
            key: point.label,
            name: point.label,
            value: point.value,
            previous: point.previous,
            color: colorOf(point.i),
            linked: hover === point.i,
            tip: () => tip(point),
          }))}
          max={max}
          format={props.format}
          goodWhen={props.goodWhen}
          desc={desc}
          onSort={() => setDesc((value) => !value)}
        />
      </div>
      {unplaced.length ? (
        <PartNote>
          {unplaced.length === 1
            ? `1 place not on the map: ${unplaced[0]}`
            : `${unplaced.length} places not on the map: ${unplaced.join(", ")}`}
        </PartNote>
      ) : null}
    </div>
  );
}
