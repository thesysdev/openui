import * as SliderPrimitive from "@radix-ui/react-slider";
import clsx from "clsx";
import { KeyboardEvent, useEffect, useMemo, useState } from "react";

// A slider shaped like a form field, the way design tools draw number scrubs:
// the label sits inside on the left, the fill sits behind it and follows the
// pointer anywhere on the field, and the value on the right is editable text.

export interface FieldSliderProps {
  label: string;
  name?: string;
  variant?: "continuous" | "discrete";
  min: number;
  max: number;
  step?: number;
  defaultValue?: number[];
  disabled?: boolean;
  onValueCommit?: (value: number[]) => void;
  className?: string;
}

// Discrete sliders get a tick per step, unless the steps would crowd the field.
const MAX_TICKS = 24;

const decimalsOf = (n: number) => {
  const s = String(n);
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
};

const ValueText = ({
  value,
  min,
  max,
  step,
  disabled,
  label,
  onCommit,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  label: string;
  onCommit: (v: number) => void;
}) => {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const parsed = Number(draft);
    if (draft.trim() === "" || Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const snapped = Math.round((parsed - min) / step) * step + min;
    const clamped = Math.min(max, Math.max(min, snapped));
    const rounded = Number(clamped.toFixed(decimalsOf(step)));
    setDraft(String(rounded));
    onCommit(rounded);
  };

  return (
    <input
      className="openui-field-slider__value"
      inputMode="decimal"
      aria-label={label}
      value={draft}
      disabled={disabled}
      size={Math.max(draft.length, 1)}
      onFocus={(e) => {
        setEditing(true);
        e.currentTarget.select();
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(String(value));
          setEditing(false);
          e.currentTarget.blur();
        }
      }}
    />
  );
};

export const FieldSlider = ({
  label,
  name,
  variant = "continuous",
  min,
  max,
  step,
  defaultValue,
  disabled,
  onValueCommit,
  className,
}: FieldSliderProps) => {
  const resolvedStep = step && step > 0 ? step : variant === "discrete" ? 1 : (max - min) / 100;
  const [value, setValue] = useState<number[]>(
    defaultValue && defaultValue.length > 0 ? defaultValue : [min],
  );

  useEffect(() => {
    if (defaultValue && defaultValue.length > 0) setValue(defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultValue)]);

  const isRange = value.length > 1;

  const ticks = useMemo(() => {
    if (variant !== "discrete" || max <= min) return [];
    const count = Math.floor((max - min) / resolvedStep);
    if (count < 2 || count > MAX_TICKS) return [];
    return Array.from({ length: count - 1 }, (_, i) => ((i + 1) / count) * 100);
  }, [variant, min, max, resolvedStep]);

  const setAt = (index: number, v: number) => {
    const next = [...value];
    next[index] = v;
    if (isRange) next.sort((a, b) => a - b);
    setValue(next);
    onValueCommit?.(next);
  };

  return (
    <div
      className={clsx("openui-field-slider", className, {
        "openui-field-slider--disabled": disabled,
      })}
    >
      <SliderPrimitive.Root
        className="openui-field-slider__root"
        name={name}
        min={min}
        max={max}
        step={resolvedStep}
        value={value}
        disabled={disabled}
        onValueChange={setValue}
        onValueCommit={onValueCommit}
        aria-label={label}
      >
        <SliderPrimitive.Track className="openui-field-slider__track">
          <SliderPrimitive.Range className="openui-field-slider__range" />
          {ticks.map((left) => (
            <span key={left} className="openui-field-slider__tick" style={{ left: `${left}%` }} />
          ))}
        </SliderPrimitive.Track>
        {value.map((_, i) => (
          <SliderPrimitive.Thumb key={i} className="openui-field-slider__thumb" />
        ))}
      </SliderPrimitive.Root>
      <span className="openui-field-slider__label">{label}</span>
      <span className="openui-field-slider__values">
        <ValueText
          value={value[0] ?? min}
          min={min}
          max={max}
          step={resolvedStep}
          disabled={disabled}
          label={isRange ? `${label} from` : label}
          onCommit={(v) => setAt(0, v)}
        />
        {isRange && (
          <>
            <span className="openui-field-slider__separator">–</span>
            <ValueText
              value={value[1] ?? max}
              min={min}
              max={max}
              step={resolvedStep}
              disabled={disabled}
              label={`${label} to`}
              onCommit={(v) => setAt(1, v)}
            />
          </>
        )}
      </span>
    </div>
  );
};
