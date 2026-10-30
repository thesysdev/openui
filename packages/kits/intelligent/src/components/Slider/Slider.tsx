"use client";

import { useId } from "react";
import { cx, numberText } from "../../shared/style";

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
    <div className="iui-slider">
      {(label || unitProp) && (
        <div className="iui-slider-head">
          <label htmlFor={id}>{label}</label>
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
        aria-label={label ? undefined : "Value"}
        aria-valuetext={readout}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {marks.length > 0 && (
        <div className="iui-slider-marks" aria-hidden>
          {marks.map((m, i) => {
            const at = (m.value - min) / (max - min);
            return (
              <span key={i} className={cx(at <= 0.02 && "is-start", at >= 0.98 && "is-end")} style={{ left: `calc(var(--iui-range-thumb-size) / 2 + (100% - var(--iui-range-thumb-size)) * ${at})` }}>
                {m.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
