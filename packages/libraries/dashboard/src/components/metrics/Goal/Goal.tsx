"use client";
import { MUTED_COLOR } from "../../../shared/colors";
import { useCompare } from "../../../shared/compare";

import { formatValue, type ValueFormat } from "../../../shared/format";
import { useRowHover } from "../../shared/RowHover";
import { TickMark } from "../../shared/RowMarks";
import { StatusIcon } from "../../shared/StatusIcon";
import { TooltipCard } from "../../shared/TooltipCard";

/* ---------- Goal ---------- */

export interface GoalProps {
  label: string;
  value: number;
  target: number;
  format?: ValueFormat;
  pace?: number;
  goodWhen?: "up" | "down" | "neutral";
  previous?: number;
}

export function Goal(props: GoalProps) {
  const hover = useRowHover();
  const compare = useCompare();
  // Where it stood at this point last period: a grey tick, only while compare is on.
  const previous = compare.enabled && typeof props.previous === "number" ? props.previous : null;
  const noTarget = !(props.target > 0);
  const progress = noTarget ? (props.value > 0 ? 1 : 0) : props.value / props.target;
  const ceiling = props.goodWhen === "down";
  const pace =
    !ceiling && typeof props.pace === "number" ? Math.min(1, Math.max(0, props.pace)) : null;
  const state = ceiling
    ? props.value <= props.target
      ? "ahead"
      : "over"
    : pace === null
      ? "neutral"
      : progress >= pace
        ? "ahead"
        : "behind";
  // Past its target or limit, the track rescales to the value: a tick marks
  // the target, and the part beyond it is the overrun, in a second texture.
  const passed = !noTarget && props.value > props.target;
  // The track always spans the target; past it, the value. A previous tick past both sits at the end.
  const scale = passed ? props.value : props.target;
  const previousAt =
    previous !== null && scale > 0 ? Math.max(0, Math.min(1, previous / scale)) : null;
  const within = noTarget ? progress : Math.max(0, Math.min(props.value, props.target)) / scale;
  const beyond = passed ? (props.value - props.target) / scale : 0;
  const paceAt = pace !== null && !noTarget ? (pace * props.target) / scale : null;
  // The state alone: how far over or past is already in the header ("2.3% / 2%") and the tooltip.
  const stateText = ceiling
    ? state === "ahead"
      ? "Within limit"
      : "Over limit"
    : passed
      ? "Past target"
      : state === "ahead"
        ? "Ahead of pace"
        : "Behind pace";
  // The kit tooltip on the track: value, target or limit, and where the pace says it should be.
  const tip = () => (
    <TooltipCard
      title={props.label}
      format={props.format}
      rows={[
        { name: "Value", color: "var(--openui-dashboard-series-1)", value: props.value },
        ...(noTarget
          ? []
          : [
              {
                name: ceiling ? "Limit" : "Target",
                color: "var(--openui-dashboard-ink)",
                value: props.target,
                mark: <TickMark color="var(--openui-dashboard-ink)" />,
              },
            ]),
        ...(pace !== null && !noTarget
          ? [
              {
                name: "Expected by now",
                color: "var(--openui-dashboard-ink-muted)",
                value: pace * props.target,
                mark: <TickMark color="var(--openui-dashboard-ink-muted)" />,
              },
            ]
          : []),
        ...(previous !== null
          ? [
              {
                name: compare.label,
                color: MUTED_COLOR,
                value: previous,
                mark: <TickMark color={MUTED_COLOR} />,
              },
            ]
          : []),
      ]}
    />
  );
  return (
    <div className="openui-dashboard-goal openui-dashboard-rows" ref={hover.ref}>
      <div className="openui-dashboard-goal-top">
        <span>{props.label}</span>
        <span>
          <strong>{formatValue(props.value, props.format)}</strong>
          <span style={{ color: "var(--openui-dashboard-ink-muted)" }}>
            {" "}
            / {formatValue(props.target, props.format)}
          </span>
        </span>
      </div>
      <div
        className="openui-dashboard-goal-track"
        data-passed={passed ? "" : undefined}
        {...hover.rowProps(props.label, tip)}
      >
        <div
          className="openui-dashboard-goal-fill openui-dashboard-tex-0"
          data-state={state}
          style={{ width: `${within * 100}%` }}
        />
        {passed ? (
          <div
            className="openui-dashboard-goal-fill openui-dashboard-goal-beyond openui-dashboard-tex-1"
            data-state={state}
            style={{ width: `${beyond * 100}%` }}
          />
        ) : null}
        {passed ? (
          <span className="openui-dashboard-goal-mark" style={{ left: `${within * 100}%` }} />
        ) : null}
        {paceAt !== null ? (
          <span className="openui-dashboard-goal-pace" style={{ left: `${paceAt * 100}%` }} />
        ) : null}
        {previousAt !== null ? (
          <span className="openui-dashboard-goal-prev" style={{ left: `${previousAt * 100}%` }} />
        ) : null}
      </div>
      <div className="openui-dashboard-goal-foot">
        {/* Only what the header and bar don't already say: the state. The value, target and how far past it
              are in the header ("2.3% / 2%"); the share of target is the bar's length (and in the tooltip). */}
        {noTarget ? <span>No target set</span> : null}
        {!noTarget && (ceiling || pace !== null || passed) ? (
          <span className="openui-dashboard-goal-state">
            <StatusIcon
              tone={
                state === "ahead"
                  ? "good"
                  : state === "behind"
                    ? "warning"
                    : state === "over"
                      ? "bad"
                      : "good"
              }
            />
            {stateText}
          </span>
        ) : null}
      </div>
      {hover.tip}
    </div>
  );
}
