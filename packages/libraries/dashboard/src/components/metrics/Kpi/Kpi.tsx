"use client";

import { MUTED_COLOR, seriesColor, textureOf } from "../../../shared/colors";
import { useCompare } from "../../../shared/compare";
import { formatDateText, formatValue, type ValueFormat } from "../../../shared/format";
import { foldParts } from "../../../shared/parts";
import { columnFormatter } from "../../../shared/scales";
import type { Tone } from "../../../shared/schema";
import { toNumbers } from "../../../shared/values";
import { useViewState } from "../../../shared/viewState";
import { DeltaBadge } from "../../shared/DeltaBadge";
import { partsNote } from "../../shared/PartNote";
import { Sparkline } from "../../shared/Sparkline";
import { Sheen, StateFrame } from "../../shared/States";
import { StatusIcon } from "../../shared/StatusIcon";

/* ---------- Kpi: the stat tile ---------- */

export interface KpiProps {
  label: string;
  value?: number | string | null;
  format?: ValueFormat;
  previous?: number | null;
  goodWhen?: "up" | "down" | "neutral";
  hint?: string;
  trend?: (number | null)[];
  trendPrevious?: (number | null)[];
  tone?: Tone;
  target?: number;
  split?: { label: string; value: number }[];
  states?: ("good" | "warning" | "bad" | null)[];
  streaming: boolean;
}

/* ---------- Small charts a tile can carry (one per tile) ---------- */

/** Progress toward a target: a filled track, the share and the target named under it. */
function ProgressMeter({
  value,
  target,
  format,
  goodWhen,
}: {
  value: number;
  target: number;
  format: KpiProps["format"];
  goodWhen: KpiProps["goodWhen"];
}) {
  const share = target > 0 ? value / target : 0;
  // One decimal, as every percent in the kit: 113.3% of limit, not 113%.
  const percent = formatValue(share * 100, "percent");
  // When lower is better the target is a ceiling, so it reads as a limit.
  const noun = goodWhen === "down" ? "limit" : "target";
  return (
    <div
      className="openui-dashboard-kpi-visual"
      role="img"
      aria-label={`${percent} of the ${formatValue(target, format)} ${noun}`}
    >
      <div className="openui-dashboard-kpi-meter-track">
        <div
          className="openui-dashboard-kpi-meter-fill openui-dashboard-tex-0"
          style={{ width: `${Math.min(1, Math.max(0, share)) * 100}%` }}
        />
      </div>
      <div className="openui-dashboard-kpi-caption">
        <span>
          {percent} of {noun}
        </span>
        <span>{formatValue(target, format)}</span>
      </div>
    </div>
  );
}

/** What a total is made of: three parts in their given order; past three, the smallest fold into Other, as on the Donut. */
function SplitBar({ parts }: { parts: { label: string; value: number }[] }) {
  const positive = parts.filter((part) => part.value > 0);
  const dropped = parts.filter((part) => !(part.value > 0)).map((part) => part.label);
  // Three kept, not two plus Other: a fourth part is the first that folds.
  const folded = foldParts(positive, 3, 3);
  const kept = folded.kept.map((part, i) => ({ ...part, color: seriesColor(i) }));
  const all =
    folded.other > 0
      ? [...kept, { label: "Other", value: folded.other, color: MUTED_COLOR }]
      : kept;
  const total = all.reduce((sum, part) => sum + part.value, 0);
  if (!total) return null;
  // One decimal, padded down the legend, as in every other part-to-whole chart.
  const shareText = columnFormatter(
    all.map((part) => (part.value / total) * 100),
    "percent",
  );
  const share = (value: number) => shareText((value / total) * 100);
  return (
    <div
      className="openui-dashboard-kpi-visual"
      role="img"
      aria-label={all.map((part) => `${part.label} ${share(part.value)}`).join(", ")}
    >
      <div className="openui-dashboard-kpi-split-bar">
        {all.map((part, i) => (
          <span
            key={`${i}-${part.label}`}
            className={`openui-dashboard-tex-${textureOf(i)}`}
            style={{ flexGrow: part.value, backgroundColor: part.color }}
          />
        ))}
      </div>
      <div className="openui-dashboard-kpi-split-legend">
        {all.map((part, keyIndex) => (
          <span key={`${keyIndex}-${part.label}`}>
            <i style={{ background: part.color }} />
            {part.label} {share(part.value)}
          </span>
        ))}
      </div>
      {partsNote(dropped)}
    </div>
  );
}

/** One small dot per period, good / warning / bad, in a line with its count. */
function StatusStrip({ states }: { states: ("good" | "warning" | "bad" | null)[] }) {
  const good = states.filter((state) => state === "good").length;
  return (
    <div
      className="openui-dashboard-kpi-status"
      role="img"
      aria-label={`${good} of ${states.length} periods good`}
    >
      <span className="openui-dashboard-kpi-status-dots">
        {states.map((state, i) => (
          <span key={i} data-state={state ?? undefined} />
        ))}
      </span>
      <span className="openui-dashboard-kpi-caption">
        {good} of {states.length} good
      </span>
    </div>
  );
}

export function Kpi(props: KpiProps) {
  const compare = useCompare();
  const override = useViewState();
  const writing = props.streaming && props.value == null;
  const trend = toNumbers(props.trend);
  const trendPrevious = toNumbers(props.trendPrevious);
  const text = typeof props.value === "string" ? props.value : null;
  const states = Array.isArray(props.states) ? props.states : [];
  const split = Array.isArray(props.split)
    ? props.split.filter((part) => part && typeof part.value === "number")
    : [];
  // One small chart per tile, most specific first.
  const chart =
    text !== null
      ? null
      : states.length
        ? "states"
        : split.length
          ? "split"
          : typeof props.target === "number" && typeof props.value === "number"
            ? "target"
            : trend.length > 1
              ? "line"
              : null;
  return (
    <section className="openui-dashboard-card openui-dashboard-kpi" aria-label={props.label}>
      {(override ?? (writing ? "loading" : null)) === "loading" ? <Sheen /> : null}
      <div className="openui-dashboard-kpi-label">
        <span>{props.label}</span>
      </div>
      {/* While the model writes it, a tile with its label but no value yet shows the value bar. */}
      <StateFrame compact auto={writing ? "loading" : null}>
        <div className="openui-dashboard-kpi-main">
          {text !== null ? (
            <div className="openui-dashboard-kpi-value openui-dashboard-kpi-text" title={text}>
              <span className="openui-dashboard-kpi-text-value">
                {formatDateText(text) ?? text}
              </span>
              {props.tone ? <StatusIcon tone={props.tone} /> : null}
            </div>
          ) : (
            <div className="openui-dashboard-kpi-value">
              {formatValue(props.value, props.format)}
            </div>
          )}
          {chart === "line" ? (
            <div className="openui-dashboard-kpi-spark-wrap">
              <Sparkline
                values={trend}
                previous={trendPrevious.length ? trendPrevious : undefined}
                showPrevious={compare.enabled}
              />
            </div>
          ) : null}
        </div>
        {chart === "target" ? (
          <ProgressMeter
            value={props.value as number}
            target={props.target as number}
            format={props.format}
            goodWhen={props.goodWhen}
          />
        ) : null}
        {chart === "split" ? <SplitBar parts={split} /> : null}
        {chart === "states" ? <StatusStrip states={states} /> : null}
        {text === null && typeof props.previous === "number" && typeof props.value === "number" ? (
          <div className="openui-dashboard-kpi-foot">
            <DeltaBadge
              current={props.value}
              previous={props.previous}
              format={props.format}
              goodWhen={props.goodWhen}
            />
            <span>vs {formatValue(props.previous, props.format)}</span>
          </div>
        ) : null}
        {props.hint ? <div className="openui-dashboard-kpi-hint">{props.hint}</div> : null}
      </StateFrame>
    </section>
  );
}
