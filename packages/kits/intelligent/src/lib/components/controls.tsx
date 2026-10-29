"use client";

import {
  action,
  defineComponent,
  reactive,
  useFormName,
  useIsStreaming,
  useStateField,
  useTriggerAction,
} from "@openuidev/react-lang";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { z } from "zod/v4";
import { choice, choiceList, Field, numberText, optionList, options, useFieldName, useRunAction } from "./controlHelpers";
import { Glyph } from "./glyph";
import { bg, children, color, onColor, cx, option, radius, radiusSchema, space, textOf, toOption, type Option } from "./style";

// Actions
export const Button = defineComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    action: action().optional(),
    variant: z.enum(["solid", "outline", "soft", "ghost"]).optional(),
    color: z.enum(["primary", "danger", "success"]).optional(),
    size: z.enum(["sm", "md", "lg"]).optional(),
    icon: z.string().optional(),
    disabled: z.boolean().optional(),
    block: z.boolean().optional(),
  }),
  description: "icon is a lucide name.",
  component: ({ props }) => {
    const run = useRunAction();
    const streaming = useIsStreaming();
    const label = String(props.label ?? "");
    return (
      <button
        type="button"
        className={cx(
          "iui-button",
          `iui-button-${props.variant ?? "solid"}`,
          props.color && props.color !== "primary" && `iui-button-${props.color}`,
          `iui-button-${props.size ?? "md"}`,
          props.block && "iui-block",
        )}
        disabled={!!props.disabled || streaming}
        onClick={() => run(label, props.action, true)}
      >
        {props.icon ? <Glyph name={props.icon} size={props.size === "sm" ? 14 : 16} /> : null}
        {label}
      </button>
    );
  },
});

export const Pressable = defineComponent({
  name: "Pressable",
  props: z.object({
    children,
    action: action().optional(),
    selected: z.boolean().optional(),
    padding: z.number().optional(),
    background: color.optional(),
    radius: radiusSchema.optional(),
  }),
  description: "Makes any content clickable, such as a tile or a swatch.",
  component: function PressableView({ props, renderNode }) {
    const run = useRunAction();
    const streaming = useIsStreaming();
    const ref = useRef<HTMLDivElement>(null);
    const press = () => {
      if (!streaming) run(textOf(ref.current), props.action, false);
    };
    // Clicks meant for a control inside the tile stay with that control.
    const onClick = (event: MouseEvent<HTMLDivElement>) => {
      const target = (event.target as Element).closest("button,a,input,select,textarea,label,[role=button]");
      if (target === event.currentTarget) press();
    };
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      press();
    };
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-pressed={props.selected === undefined ? undefined : !!props.selected}
        aria-disabled={streaming || undefined}
        className={cx("iui-pressable", props.selected && "is-selected")}
        style={{ padding: space(props.padding), background: bg(props.background), ...onColor(props.background), borderRadius: radius(props.radius) }}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        {renderNode(props.children)}
      </div>
    );
  },
});

// Inputs









const DATE = /^\d{4}-\d{2}-\d{2}$/;


const clock = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
};








export const SegmentedControl = defineComponent({
  name: "SegmentedControl",
  props: z.object({ value: reactive(z.string()), options, block: z.boolean().optional() }),
  description: "2 to 4 short choices in a row.",
  component: function SegmentedView({ props, statementId }) {
    const field = useStateField(useFieldName(undefined, statementId), props.value);
    const value = field.value == null ? "" : String(field.value);
    return (
      <div className={cx("iui-segmented", props.block && "iui-block")} role="radiogroup">
        {optionList(props.options).map((o, i) => (
          <button
            key={`${o.value}-${i}`}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            className={cx(o.value === value && "is-selected")}
            onClick={() => field.setValue(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  },
});


export const Slider = defineComponent({
  name: "Slider",
  props: z.object({
    value: reactive(z.number()),
    min: z.number(),
    max: z.number(),
    step: z.number().optional(),
    label: z.string().optional(),
    unit: z.string().optional(),
    marks: z.array(z.object({ value: z.number(), label: z.string() })).optional(),
  }),
  description: 'Shows label and value; unit like "%" or "$" formats the value.',
  component: function SliderView({ props, statementId }) {
    const field = useStateField(useFieldName(props.label, statementId), props.value);
    const min = Number.isFinite(props.min) ? props.min : 0;
    const max = Number.isFinite(props.max) && props.max > min ? props.max : min + 100;
    const step = props.step && props.step > 0 ? props.step : 1;
    const raw = typeof field.value === "number" ? field.value : Number(field.value);
    const value = Number.isFinite(raw) ? Math.min(max, Math.max(min, raw)) : min;
    const unit = props.unit ?? "";
    const prefix = /^[$€£¥₹]/.test(unit);
    const readout = prefix ? `${unit}${numberText(value)}` : `${numberText(value)}${unit}`;
    const marks = (props.marks ?? []).filter((m) => m && Number.isFinite(m.value) && m.value >= min && m.value <= max);
    const id = useId();
    return (
      <div className="iui-slider">
        {(props.label || props.unit) && (
          <div className="iui-slider-head">
            <label htmlFor={id}>{props.label}</label>
            <output htmlFor={id}>{readout}</output>
          </div>
        )}
        <input
          id={id}
          className="iui-range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={props.label ? undefined : "Value"}
          aria-valuetext={readout}
          onChange={(event) => field.setValue(Number(event.target.value))}
        />
        {marks.length > 0 && (
          <div className="iui-slider-marks" aria-hidden>
            {marks.map((m, i) => {
              const at = (m.value - min) / (max - min);
              return (
                <span key={i} className={cx(at <= 0.02 && "is-start", at >= 0.98 && "is-end")} style={{ left: `calc(9px + (100% - 18px) * ${at})` }}>
                  {m.label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  },
});







export const Timer = defineComponent({
  name: "Timer",
  props: z.object({
    seconds: reactive(z.number()),
    label: z.string().optional(),
  }),
  description: "Countdown with start, pause and reset. It counts the bound seconds down to 0, so other statements can react, e.g. $left == 0.",
  component: function TimerView({ props, statementId }) {
    const field = useStateField(useFieldName(props.label, statementId), props.seconds);
    const streaming = useIsStreaming();
    const raw = typeof field.value === "number" ? field.value : Number(field.value);
    const left = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
    const [running, setRunning] = useState(false);
    // The ticking interval reads the latest value and setter, not the ones from when it started
    const live = useRef({ left, setValue: field.setValue });
    live.current = { left, setValue: field.setValue };
    // What Reset goes back to: the value when the countdown first started
    const [startedAt, setStartedAt] = useState<number | null>(null);

    useEffect(() => {
      if (!running) return;
      const id = setInterval(() => {
        const next = Math.max(0, live.current.left - 1);
        live.current.left = next;
        live.current.setValue(next);
        if (next === 0) setRunning(false);
      }, 1000);
      return () => clearInterval(id);
    }, [running]);

    const toggle = () => {
      if (!running && startedAt === null) setStartedAt(left);
      setRunning(!running);
    };
    const reset = () => {
      setRunning(false);
      if (startedAt !== null) field.setValue(startedAt);
      setStartedAt(null);
    };
    const done = left === 0 && startedAt !== null;
    return (
      <div className={cx("iui-timer", running && "is-running", done && "is-done")} role="timer" aria-label={props.label || "Timer"}>
        <div className="iui-timer-read">
          {props.label && <span className="iui-label">{props.label}</span>}
          <span className="iui-timer-time">{clock(left)}</span>
        </div>
        <div className="iui-timer-actions">
          <button type="button" className="iui-button iui-button-solid iui-button-sm" disabled={streaming || left === 0} onClick={toggle}>
            <Glyph name={running ? "pause" : "play"} size={14} />
            {running ? "Pause" : startedAt === null || left === 0 ? "Start" : "Resume"}
          </button>
          <button type="button" className="iui-button iui-button-ghost iui-button-sm" disabled={streaming || startedAt === null} onClick={reset}>
            <Glyph name="rotate-ccw" size={14} />
            Reset
          </button>
        </div>
      </div>
    );
  },
});
