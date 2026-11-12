"use client";
import { useId, useState } from "react";
import { seriesColor } from "../../../shared/chartHelpers";
import { textureOf } from "../../../shared/colors";
import { useCompare } from "../../../shared/compare";
import { formatValue, type ValueFormat } from "../../../shared/format";
import { useIsomorphicLayoutEffect, useWidth } from "../../../shared/hooks";
import { columnFormatter } from "../../../shared/scales";
import { toNumbers, toStrings } from "../../../shared/values";
import { Legend } from "../../shared/Legend";
import { CHIP } from "../../shared/ReferenceChipLabel";
import { useRowHover } from "../../shared/RowHover";
import { ScrollArea } from "../../shared/ScrollArea";
import { Empty } from "../../shared/States";
import { TooltipCard } from "../../shared/TooltipCard";
import { ViewSwitch } from "../../shared/ViewSwitch";
export interface FunnelProps {
  steps: string[];
  values: number[];
  previous?: number[];
  format?: ValueFormat;
  shape?: "bars" | "funnel";
  segments: { name: string; values: (number | null)[] }[];
  basis?: "step" | "start";
}
type FunnelBasis = "step" | "start";
const BASIS_OPTIONS: { value: FunnelBasis; label: string }[] = [
  { value: "step", label: "Step to step" },
  { value: "start", label: "From start" },
];

/** The printed rate and change between two steps: from the step before, or from the first step. */
function funnelRate(values: number[], i: number, basis: FunnelBasis) {
  const base = basis === "start" ? values[0]! : values[i - 1]!;
  return { rate: base ? values[i]! / base : null, change: values[i]! - base };
}

type FunnelSegment = { name: string; values: number[]; color: string; texture: number };

/** The step with the worst step-to-step conversion, flagged when there are at least three steps. */
function biggestDrop(values: number[]): number | null {
  if (values.length < 3) return null;
  let worst: number | null = null;
  let rate = Infinity;
  for (let i = 1; i < values.length; i++) {
    if (!values[i - 1]! || values[i]! > values[i - 1]!) continue;
    const r = values[i]! / values[i - 1]!;
    if (r < rate) [rate, worst] = [r, i];
  }
  return worst;
}

/** The funnel's weakest step, in the reference chip (ink fill, surface text, CHIP measures) with a red status dot. */
const DropFlag = () => (
  <span
    className="openui-dashboard-funnel-flag"
    style={{ height: CHIP.height, borderRadius: CHIP.radius, fontSize: CHIP.fontSize }}
  >
    <span aria-hidden />
    Biggest drop
  </span>
);

/** One tooltip for both shapes: the count, its share of the first step, conversion from the step before, then each segment. */
function funnelTip({
  steps,
  values,
  previous,
  showPrevious,
  compareLabel,
  format,
  segments,
  i,
}: {
  steps: string[];
  values: number[];
  previous: (number | null)[];
  showPrevious: boolean;
  compareLabel: string;
  format?: ValueFormat | null;
  segments: FunnelSegment[];
  i: number;
}) {
  const prev = showPrevious && typeof previous[i]! === "number" ? (previous[i]! as number) : null;
  const dot = <span className="openui-dashboard-tip-dot" />;
  return (
    <TooltipCard
      title={steps[i]!}
      format={format ?? "number"}
      rows={[
        {
          name: "Count",
          color: "var(--openui-dashboard-series-1)",
          value: values[i]!,
          previous: prev,
        },
        ...(prev !== null
          ? [
              {
                name: compareLabel,
                color: "var(--openui-dashboard-ink-secondary)",
                value: prev,
                dashed: true,
              },
            ]
          : []),
        {
          name: `Share of ${steps[0]!}`,
          color: "transparent",
          value: (values[i]! / values[0]!) * 100,
          format: "percent" as const,
          mark: dot,
        },
        ...(i > 0 && values[i - 1]!
          ? [
              {
                name: "Converted from the step before",
                color: "transparent",
                value: (values[i]! / values[i - 1]!) * 100,
                format: "percent" as const,
                mark: dot,
              },
            ]
          : []),
        ...segments.map((segment) => ({
          name: segment.name,
          color: segment.color,
          value: segment.values[i] ?? null,
        })),
      ]}
    />
  );
}

const FUNNEL_HEIGHT = 168;
/** Below this width per step the names collide, so the funnel falls back to bars. */
const FUNNEL_MIN_STEP = 104;
/** About seven steps (26px bars, 32px connectors) before the list scrolls inside the card. */
const FUNNEL_LIST_MAX = 408;
/** Room kept at the end of every bar track for the rate printed after the bar. */
const FUNNEL_RATE_ROOM = 56;

/**
 * The funnel drawn as a funnel: each step a block whose height is its share
 * of the first, standing on one baseline, tapering into the next with a curve;
 * the taper is the drop-off. Names and counts sit above, the loss under each taper.
 */
function FunnelShape({
  steps,
  values,
  previous,
  showPrevious,
  compareLabel,
  format,
  width,
  segments,
  basis,
}: {
  steps: string[];
  values: number[];
  previous: (number | null)[];
  showPrevious: boolean;
  compareLabel: string;
  format: FunnelProps["format"];
  width: number;
  segments: FunnelSegment[];
  basis: FunnelBasis;
}) {
  const id = useId().replace(/:/g, "");
  const top = values[0]!;
  const prevTop = previous[0] ?? 0;
  const n = steps.length;
  // The plot takes whatever height its card leaves (FUNNEL_HEIGHT at least), so a tall row draws taller blocks.
  const [growEl, setGrowEl] = useState<HTMLDivElement | null>(null);
  const [room, setRoom] = useState(0);
  useIsomorphicLayoutEffect(() => {
    if (!growEl) return;
    const update = () => setRoom(Math.floor(growEl.getBoundingClientRect().height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(growEl);
    return () => observer.disconnect();
  }, [growEl]);
  const H = Math.max(FUNNEL_HEIGHT, room);
  const col = width / n;
  const flat = col * 0.58;
  // Blocks top out 18px under the plot's top, so the rate above even a full block fits.
  const height = (value: number) => Math.max(6, (value / top) * (H - 18));
  // Bottom-aligned: every block stands on one straight baseline, so only the top edge steps down.
  const edge = (h: number) => [H - h, H] as const;
  const hover = useRowHover();
  // Block height shows each step's share of the first; the printed rate is step-to-step conversion.
  const conversionText = columnFormatter(
    values.slice(1).map((_, i) => (funnelRate(values, i + 1, basis).rate ?? 0) * 100),
    "percent",
  );
  // The weakest step is a step-to-step reading, so it's flagged only there.
  const worst = basis === "step" ? biggestDrop(values) : null;
  return (
    <div
      className="openui-dashboard-funnel-shape"
      style={{ ["--openui-dashboard-funnel-cols" as string]: n }}
    >
      <div className="openui-dashboard-funnel-heads">
        {steps.map((step, i) => (
          <div key={step}>
            <div className="openui-dashboard-funnel-name">{step}</div>
            <div className="openui-dashboard-funnel-count">
              {formatValue(values[i]!, format ?? "number")}
            </div>
          </div>
        ))}
      </div>
      <div className="openui-dashboard-funnel-grow" ref={setGrowEl}>
        <div
          className="openui-dashboard-funnel-plot openui-dashboard-rows"
          ref={hover.ref}
          style={{ height: H }}
        >
          <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} aria-hidden>
            <defs>
              <pattern
                id={`${id}-dots`}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <circle
                  cx="1.8"
                  cy="1.8"
                  r="0.8"
                  fill="black"
                  style={{ opacity: "var(--openui-dashboard-bar-ink)" }}
                />
              </pattern>
            </defs>
            {steps.map((step, i) => {
              const h = height(values[i]!);
              const [y0, y1] = edge(h);
              const x0 = i * col;
              const x1 = i === n - 1 ? width : x0 + flat;
              const opacity = 1 - i * (0.5 / Math.max(n - 1, 1));
              const block = `M${x0},${y0} H${x1} V${y1} H${x0} Z`;
              let taper: string | null = null;
              if (i < n - 1) {
                const [n0, n1] = edge(height(values[i + 1]!));
                const x2 = (i + 1) * col;
                const mid = (x1 + x2) / 2;
                taper = `M${x1},${y0} C${mid},${y0} ${mid},${n0} ${x2},${n0} V${n1} C${mid},${n1} ${mid},${y1} ${x1},${y1} Z`;
              }
              const prev =
                showPrevious && typeof previous[i]! === "number" && prevTop
                  ? edge(Math.max(6, ((previous[i]! as number) / prevTop) * (H - 18)))
                  : null;
              return (
                <g key={step}>
                  {segments.length ? (
                    // Split: the block stacks one band per segment, top to bottom in segment order.
                    (() => {
                      const total =
                        segments.reduce((sum, segment) => sum + (segment.values[i] ?? 0), 0) || 1;
                      let at = y0;
                      return segments.map((segment, k) => {
                        const h = ((segment.values[i] ?? 0) / total) * (y1 - y0);
                        const band = (
                          <g key={segment.name}>
                            <rect
                              x={x0}
                              y={at}
                              width={x1 - x0}
                              height={Math.max(h - (k < segments.length - 1 ? 1 : 0), 0)}
                              fill={segment.color}
                            />
                            <rect
                              x={x0}
                              y={at}
                              width={x1 - x0}
                              height={Math.max(h - (k < segments.length - 1 ? 1 : 0), 0)}
                              fill={`url(#${id}-dots)`}
                            />
                          </g>
                        );
                        at += h;
                        return band;
                      });
                    })()
                  ) : (
                    <>
                      <path d={block} fill="var(--openui-dashboard-series-1)" opacity={opacity} />
                      <path d={block} fill={`url(#${id}-dots)`} />
                    </>
                  )}
                  {taper ? (
                    <path
                      d={taper}
                      fill={
                        segments.length
                          ? "var(--openui-dashboard-ink)"
                          : "var(--openui-dashboard-series-1)"
                      }
                      opacity={segments.length ? 0.06 : opacity * 0.32}
                    />
                  ) : null}
                  {i > 0
                    ? (() => {
                        // The step's rate just above its block, on the surface: readable whatever the block's shade.
                        const { rate } = funnelRate(values, i, basis);
                        return (
                          <text
                            x={x0 + 2}
                            y={y0 - 6}
                            fontSize={12}
                            fontWeight={600}
                            style={{ fontVariantNumeric: "tabular-nums" }}
                            fill="var(--openui-dashboard-ink-secondary)"
                          >
                            {conversionText((rate ?? 0) * 100)}
                          </text>
                        );
                      })()
                    : null}
                  {prev ? (
                    <g
                      stroke="var(--openui-dashboard-ink-secondary)"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      opacity="0.7"
                    >
                      <line x1={x0 + 2} x2={x1 - 2} y1={prev[0]!} y2={prev[0]!} />
                      <line x1={x0 + 2} x2={x1 - 2} y1={prev[1]!} y2={prev[1]!} />
                    </g>
                  ) : null}
                </g>
              );
            })}
            {/* A surface gap between steps, so each block reads as its own mark. */}
            {steps.slice(1).map((_, i) => (
              <line
                key={i}
                x1={(i + 1) * col}
                x2={(i + 1) * col}
                y1={0}
                y2={H}
                stroke="var(--openui-dashboard-surface)"
                strokeWidth="2"
              />
            ))}
          </svg>
          {/* One hit column per step for the kit tooltip, as on the Bars shape. */}
          {steps.map((step, i) => (
            <span
              key={`hit-${step}`}
              className="openui-dashboard-funnel-hit"
              style={{ left: i * col, width: col }}
              {...hover.rowProps(step, () =>
                funnelTip({
                  steps,
                  values,
                  previous,
                  showPrevious,
                  compareLabel,
                  format,
                  segments,
                  i,
                }),
              )}
            />
          ))}
          {/* The weakest step's chip floats beside its rate above the block, so it takes no line of its own
            and the card keeps one height whichever reading the switch shows. */}
          {worst !== null
            ? (() => {
                const y0 = edge(height(values[worst]!))[0]!;
                const rateWidth =
                  conversionText((funnelRate(values, worst, basis).rate ?? 0) * 100).length * 7.8; // 12px semibold tabular digits
                return (
                  <span
                    className="openui-dashboard-funnel-flag-at"
                    style={{ left: worst * col + 2 + rateWidth + 6, top: y0 - 6 - 13 }}
                  >
                    <DropFlag />
                  </span>
                );
              })()
            : null}
          {hover.tip}
        </div>
      </div>
      <div className="openui-dashboard-funnel-rates">
        {steps.map((step, i) => {
          if (i === 0) return <div key={step} />;
          const { rate, change } = funnelRate(values, i, basis);
          return (
            // Under the taper, where the drop happens; the rate sits above the block.
            <div key={step} className="openui-dashboard-funnel-loss">
              {rate !== null ? (
                <>
                  {change <= 0 ? (
                    <span className="openui-dashboard-funnel-lost">
                      −{formatValue(-change, format ?? "number")}
                    </span>
                  ) : (
                    <span className="openui-dashboard-funnel-more">
                      +{formatValue(change, format ?? "number")}
                    </span>
                  )}
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Funnel(props: FunnelProps) {
  const compare = useCompare();
  // Hooks above the early return: a funnel can render empty mid-stream, then fill.
  const [measure, width] = useWidth();
  const hover = useRowHover();
  // Only the reader's choice is state: props stream in after mount, so the default is read live.
  const [basisChoice, setBasis] = useState<FunnelBasis | null>(null);
  const basis: FunnelBasis = basisChoice ?? props.basis ?? "step";
  const shadeId = `fs${useId().replace(/:/g, "")}`;
  const steps = toStrings(props.steps);
  const values = toNumbers(props.values).map((value) => value ?? 0);
  const previous = toNumbers(props.previous);
  const top = values[0] ?? 0;
  if (!steps.length || !top) return <Empty />;
  const prevTop = previous[0] ?? 0;
  const asFunnel = props.shape === "funnel" && width >= steps.length * FUNNEL_MIN_STEP;
  // Bars scale to the track less FUNNEL_RATE_ROOM, so the rate after even a full bar still fits.
  const scaled = (share: number) => `calc((100% - ${FUNNEL_RATE_ROOM}px) * ${share})`;
  // Segments split each step by plan, channel or cohort: colour and texture per segment, as in stacked bars.
  const segments: FunnelSegment[] = props.segments.slice(0, 8).map((segment, k) => ({
    name: segment.name,
    values: toNumbers(segment.values).map((value) => value ?? 0),
    color: seriesColor(k),
    texture: textureOf(k),
  }));
  // As with stacked Bars, a split funnel doesn't draw the previous period: its markers would cut across the segments.
  const showPrevious = compare.enabled && prevTop > 0 && !segments.length;
  // One legend row above the funnel, as on every chart: the segments, and the previous period while compare is on.
  // Nothing is held in reserve below, so the card's bottom padding matches every other card.
  const legendEntries = [
    ...segments.map((segment) => ({ name: segment.name, color: segment.color })),
    ...(showPrevious
      ? [{ name: compare.label, color: "var(--openui-dashboard-ink-secondary)", dashed: true }]
      : []),
  ];
  // The top row: the legend on the left and the basis switch on the right, in both shapes.
  const segmentLegend = (
    <>
      {/* The switch goes to the card header's top right (ViewSwitch portals it there). */}
      {steps.length > 2 ? (
        <ViewSwitch
          label="Rates"
          prefix="Rates"
          options={BASIS_OPTIONS}
          value={basis}
          onChange={setBasis}
        />
      ) : null}
      {legendEntries.length ? (
        <div className="openui-dashboard-chart-top">
          <Legend entries={legendEntries} />
        </div>
      ) : null}
    </>
  );
  // Bar length shows each step's share of the first (the tooltip states it); the printed rate is
  // step-to-step conversion, one precision down the column: 77.0% beside 60.8%.
  const conversionText = columnFormatter(
    values.slice(1).map((_, i) => (funnelRate(values, i + 1, basis).rate ?? 0) * 100),
    "percent",
  );
  const worst = basis === "step" ? biggestDrop(values) : null;
  if (props.shape === "funnel" && (asFunnel || !width)) {
    return (
      <div className="openui-dashboard-funnel" ref={measure}>
        {segmentLegend}
        {width ? (
          <FunnelShape
            steps={steps}
            values={values}
            previous={previous}
            showPrevious={showPrevious}
            compareLabel={compare.label}
            format={props.format}
            width={width}
            segments={segments}
            basis={basis}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="openui-dashboard-funnel openui-dashboard-rows"
      ref={(el) => {
        measure(el);
        hover.ref.current = el;
      }}
    >
      {segmentLegend}
      {/* Long funnels scroll inside the card, with the fade and stepper used by every list. */}
      <ScrollArea maxHeight={FUNNEL_LIST_MAX} label="Scroll the steps" watch={steps.length}>
        <div className="openui-dashboard-funnel-steps">
          {steps.map((step, i) => {
            const value = values[i] ?? 0;
            const share = value / top;
            const prevShare =
              showPrevious && typeof previous[i]! === "number"
                ? (previous[i]! as number) / prevTop
                : null;
            const opacity = segments.length ? 1 : 1 - i * (0.5 / Math.max(steps.length - 1, 1));
            const conversion = i > 0 && values[i - 1]! ? value / values[i - 1]! : null;
            return (
              <div key={step}>
                {conversion !== null ? (
                  <div className="openui-dashboard-funnel-link">
                    <span />
                    {/* The connector: a tint narrowing from this bar's end to the next, so the drop-off has a shape. */}
                    <div className="openui-dashboard-funnel-gap">
                      <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
                        {/* Grey on the left shading into the colour at the bars' end (the last segment's, when split). */}
                        <defs>
                          <linearGradient id={`${shadeId}-${i}`} x1="0" x2="1" y1="0" y2="0">
                            <stop
                              offset="0"
                              stopColor="var(--openui-dashboard-ink)"
                              stopOpacity="0.05"
                            />
                            <stop
                              offset="1"
                              stopColor={
                                segments.length
                                  ? segments[segments.length - 1]!.color
                                  : "var(--openui-dashboard-series-1)"
                              }
                              stopOpacity={
                                segments.length
                                  ? 0.16
                                  : (1 - (i - 1) * (0.5 / Math.max(steps.length - 1, 1))) * 0.18
                              }
                            />
                          </linearGradient>
                        </defs>
                        <path
                          d={(() => {
                            const a = Math.max(((values[i - 1] ?? 0) / top) * 100, 0.6);
                            const b = Math.max(share * 100, 0.6);
                            return `M0,0 H${a} C${a},16 ${b},16 ${b},32 H0 Z`;
                          })()}
                          fill={`url(#${shadeId}-${i})`}
                        />
                      </svg>
                      {(() => {
                        // From the step before, or from the first step: the rate and the count lost (the minus says it).
                        const { change } = funnelRate(values, i, basis);
                        return (
                          <span className="openui-dashboard-funnel-rate">
                            {change <= 0 ? (
                              <span className="openui-dashboard-funnel-lost">
                                −{formatValue(-change, props.format ?? "number")}
                              </span>
                            ) : (
                              // Re-entry or a step counted independently: more people than the step before.
                              <span className="openui-dashboard-funnel-more">
                                +{formatValue(change, props.format ?? "number")}
                              </span>
                            )}
                            {i === worst ? <DropFlag /> : null}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                ) : null}
                <div
                  className="openui-dashboard-funnel-step openui-dashboard-hrow"
                  // The kit tooltip, as on every chart: the count, its share of the first step, and the previous period.
                  {...hover.rowProps(step, () =>
                    funnelTip({
                      steps,
                      values,
                      previous,
                      showPrevious,
                      compareLabel: compare.label,
                      format: props.format,
                      segments,
                      i,
                    }),
                  )}
                >
                  {/* Name and count on one line, so the row is as tall as its bar and the connectors meet it. */}
                  <div className="openui-dashboard-funnel-label">
                    <span className="openui-dashboard-funnel-name">{step}</span>
                    <span className="openui-dashboard-funnel-count">
                      {formatValue(value, props.format ?? "number")}
                    </span>
                  </div>
                  <div className="openui-dashboard-funnel-bar">
                    {segments.length ? (
                      <div
                        className="openui-dashboard-funnel-split"
                        style={{ width: scaled(Math.max(share, 0.006)) }}
                      >
                        {segments.map((segment) => (
                          <span
                            key={segment.name}
                            className={`openui-dashboard-tex-${segment.texture}`}
                            style={{
                              flexGrow: segment.values[i] ?? 0,
                              backgroundColor: segment.color,
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div
                        className="openui-dashboard-funnel-fill openui-dashboard-tex-0"
                        style={{ width: scaled(Math.max(share, 0.006)), opacity }}
                      />
                    )}
                    {i > 0 ? (
                      // The step's rate just after its bar, on the track: readable whatever the bar's shade.
                      <span className="openui-dashboard-funnel-in" style={{ left: scaled(share) }}>
                        {conversionText((funnelRate(values, i, basis).rate ?? 0) * 100)}
                      </span>
                    ) : null}
                    {prevShare !== null ? (
                      <span
                        className="openui-dashboard-funnel-prev"
                        style={{ left: scaled(prevShare) }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      {hover.tip}
    </div>
  );
}
