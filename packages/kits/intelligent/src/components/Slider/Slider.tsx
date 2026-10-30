"use client";

import clsx from "clsx";
import { useId } from "react";
import { numberText } from "../../shared/style";
import { names, styles, THUMB } from "./slider.styles";

export interface SliderMark {
  value: number;
  label: string;
}

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  /** Formats the value: a currency sign goes before it ("$5"), anything else after ("45%"). */
  unit?: string;
  /** Labels under the track. */
  marks?: SliderMark[];
}

/** A range with its label and value above, and optional marks under the track. */
export function Slider({ value: rawValue, onChange, min: minProp, max: maxProp, step: stepProp, label, unit: unitProp, marks: marksProp }: SliderProps) {
  const min = Number.isFinite(minProp) ? minProp : 0;
  const max = Number.isFinite(maxProp) && maxProp > min ? maxProp : min + 100;
  const step = stepProp && stepProp > 0 ? stepProp : 1;
  const value = Number.isFinite(rawValue) ? Math.min(max, Math.max(min, rawValue)) : min;
  const unit = unitProp ?? "";
  const prefix = /^[$€£¥₹]/.test(unit);
  const readout = prefix ? `${unit}${numberText(value)}` : `${numberText(value)}${unit}`;
  const marks = (marksProp ?? []).filter((m) => m && Number.isFinite(m.value) && m.value >= min && m.value <= max);
  const id = useId();
  return (
    <div className={clsx(styles.root, names.root)}>
      {(label || unitProp) && (
        <div className={clsx(styles.head, names.head)}>
          <label htmlFor={id} className={clsx(styles.label, names.label)}>{label}</label>
          <output htmlFor={id} className={clsx(styles.output, names.output)}>{readout}</output>
        </div>
      )}
      <input
        id={id}
        className={clsx(styles.range, names.range)}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label ? undefined : "Value"}
        aria-valuetext={readout}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {marks.length > 0 && (
        <div className={clsx(styles.marks, names.marks)} aria-hidden>
          {marks.map((m, i) => {
            const at = (m.value - min) / (max - min);
            return (
              <span key={i} className={clsx(styles.mark, names.mark)} data-edge={at <= 0.02 ? "start" : at >= 0.98 ? "end" : undefined} style={{ left: `calc(${THUMB} / 2 + (100% - ${THUMB}) * ${at})` }}>
                {m.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
