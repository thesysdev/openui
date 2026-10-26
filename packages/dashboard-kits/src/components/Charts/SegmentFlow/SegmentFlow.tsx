import clsx from "clsx";
import { useMemo, useState, type KeyboardEvent } from "react";
import { formatNumber } from "../../../core/format";
import { useContainerSize } from "../hooks";
import { KIT_CHART_PREFIX } from "../utils/constants";
import { flowLayout, type FlowLink } from "./flowGeometry";

const P = `${KIT_CHART_PREFIX}-flow`;
const ROW = 30;
const NODE = 10;

export interface SegmentFlowProps {
  links: FlowLink[];
  /** Node names best first; a link toward an earlier name is an improvement. */
  order: string[];
  /** Column headings, e.g. ["90 days ago", "Today"]. */
  columns?: [string, string];
  /** Names that enter from outside (first orders) and leave (lapsed), drawn apart from the rest. */
  source?: string;
  sink?: string;
  /** What the flow counts, for the readout. Default "customers". */
  unit?: string;
  className?: string;
}

type Direction = "up" | "down" | "stay" | "in" | "out";

/**
 * Where customers moved between segments: the segments then on the left, now
 * on the right, each scaled to its customers, and a ribbon per move colored
 * by direction (up a segment, down, staying, new in, lapsed out). Hovering a
 * ribbon or a segment brings it forward and reads it out; arrow keys walk the
 * ribbons for keyboard readers, as the other kit charts walk their points.
 */
export function SegmentFlow({
  links,
  order,
  columns = ["90 days ago", "Today"],
  source,
  sink,
  unit = "customers",
  className,
}: SegmentFlowProps) {
  const [frameRef, size] = useContainerSize<HTMLDivElement>(640, 320);
  const [hover, setHover] = useState<{ node?: string; side?: "left" | "right"; link?: FlowLink }>();
  const names = new Set(links.flatMap((l) => [l.from, l.to]));
  // Narrow cards put each count under its name, so labels need only the name's
  // width, and nodes sit further apart so two-line labels never touch.
  const narrow = size.width < 520;
  const perSide = Math.max(
    new Set(links.map((l) => l.from)).size,
    new Set(links.map((l) => l.to)).size,
  );
  const gap = narrow ? 28 : 6;
  const height = Math.max(260, (names.size / 2 + 1) * ROW) + (narrow ? perSide * 22 : 0);
  const longest = Math.max(...[...names].map((n) => n.length));
  const labelWidth = narrow
    ? Math.min(size.width * 0.3, longest * 6.6 + 12)
    : Math.min(150, Math.max(96, size.width * 0.24));
  const x0 = labelWidth + NODE;
  const x1 = size.width - labelWidth - NODE;
  const layout = useMemo(
    () => flowLayout(links, { order, top: 6, bottom: height - 6, gap, x0, x1 }),
    [links, order, height, gap, x0, x1],
  );
  const rank = (name: string) => order.indexOf(name);
  const direction = (l: FlowLink): Direction =>
    l.from === source
      ? "in"
      : l.to === sink
        ? "out"
        : l.from === l.to
          ? "stay"
          : rank(l.to) < rank(l.from)
            ? "up"
            : "down";
  const lit = (l: FlowLink) =>
    !hover ||
    hover.link === l ||
    (hover.side === "left" && hover.node === l.from) ||
    (hover.side === "right" && hover.node === l.to);
  const moves = links
    .filter((l) => l.from !== l.to)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  const verb: Record<Direction, string> = {
    up: "moved up to",
    down: "slipped to",
    stay: "stayed",
    in: "came in as",
    out: "lapsed",
  };
  const readout = hover?.link
    ? `${hover.link.from} → ${hover.link.to}: ${formatNumber(hover.link.value)} ${unit}`
    : hover?.node
      ? `${hover.node}: ${formatNumber(
          links
            .filter((l) => (hover.side === "left" ? l.from : l.to) === hover.node)
            .reduce((t, l) => t + l.value, 0),
        )} ${unit} ${hover.side === "left" ? columns[0].toLowerCase() : columns[1].toLowerCase()}`
      : undefined;

  // Arrow keys step through the ribbons in layout order (by segment then, then
  // now) into the same readout a hover writes; Escape and blur clear it.
  const onKeyDown = (event: KeyboardEvent) => {
    const ribbons = layout.ribbons;
    const current = hover?.link;
    const at = current
      ? ribbons.findIndex((r) => r.from === current.from && r.to === current.to)
      : -1;
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = Math.min(ribbons.length - 1, at + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = Math.max(0, (at === -1 ? ribbons.length : at) - 1);
    } else if (event.key === "Escape") {
      setHover(undefined);
      event.preventDefault();
      return;
    } else return;
    event.preventDefault();
    const ribbon = ribbons[next];
    if (ribbon) setHover({ link: ribbon });
  };
  const label = `${unit[0]!.toUpperCase()}${unit.slice(1)} by segment ${columns[0].toLowerCase()} and ${columns[1].toLowerCase()}`;

  return (
    <div className={clsx(P, className)}>
      <div className={`${P}-top`} aria-live="polite">
        <span>{columns[0]}</span>
        <span className={`${P}-readout`}>{readout ?? "Hover a segment or a move"}</span>
        <span>{columns[1]}</span>
      </div>
      <div
        ref={frameRef}
        className={`${P}-frame`}
        tabIndex={0}
        role="img"
        aria-label={`${label}. Use the arrow keys to read each move.`}
        onPointerLeave={() => setHover(undefined)}
        onBlur={() => setHover(undefined)}
        onKeyDown={onKeyDown}
      >
        {size.measured && (
          <svg width={size.width} height={height} className={`${P}-svg`} aria-hidden>
            <g className={`${P}-ribbons`}>
              {layout.ribbons.map((r) => (
                <path
                  key={`${r.from}-${r.to}`}
                  d={r.d}
                  className={clsx(
                    `${P}-ribbon ${P}-ribbon--${direction(r)}`,
                    !lit(r) && `${P}-ribbon--faded`,
                  )}
                  onPointerEnter={() => setHover({ link: r })}
                />
              ))}
            </g>
            {layout.nodes.map((n) => {
              const left = n.side === "left";
              const x = left ? labelWidth : x1;
              return (
                <g
                  key={`${n.side}-${n.name}`}
                  className={`${P}-node`}
                  onPointerEnter={() => setHover({ node: n.name, side: n.side })}
                >
                  <rect
                    x={x}
                    y={n.y0}
                    width={NODE}
                    height={Math.max(1, n.y1 - n.y0)}
                    rx={2}
                    className={`${P}-bar`}
                  />
                  <text
                    x={left ? x - 8 : x + NODE + 8}
                    y={(n.y0 + n.y1) / 2}
                    dy="0.32em"
                    textAnchor={left ? "end" : "start"}
                    className={`${P}-label`}
                  >
                    {narrow ? (
                      <>
                        <tspan x={left ? x - 8 : x + NODE + 8} dy="-0.25em">
                          {n.name}
                        </tspan>
                        <tspan x={left ? x - 8 : x + NODE + 8} dy="1.2em" className={`${P}-count`}>
                          {formatNumber(n.value)}
                        </tspan>
                      </>
                    ) : (
                      <>
                        {n.name} <tspan className={`${P}-count`}>{formatNumber(n.value)}</tspan>
                      </>
                    )}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
      <p className={`${P}-moves`}>
        Biggest moves:{" "}
        {moves.map((m, i) => (
          <span key={`${m.from}-${m.to}`}>
            {i > 0 && "; "}
            {formatNumber(m.value)} {m.from} {verb[direction(m)]}
            {direction(m) === "out" ? "" : ` ${m.to}`}
          </span>
        ))}
        .
      </p>
    </div>
  );
}
