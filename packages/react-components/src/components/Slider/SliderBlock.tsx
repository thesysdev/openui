"use client";

import clsx from "clsx";
import debounce from "lodash-es/debounce.js";
import { AlertCircle } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "../Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Select";
import { Slider, SliderProps } from "./Slider";
import {
  names,
  sliderBlockInputStyles,
  sliderBlockSelectStyles,
  sliderBlockStyles,
} from "./sliderBlock.styles";

export interface SliderBlockProps extends Omit<SliderProps, "value" | "defaultValue"> {
  label: string;
  defaultValue?: number[];
  /** Props are still arriving; step-derived UI is suppressed until they settle. */
  isStreaming?: boolean;
}

const ValueInput = ({
  value,
  onChange,
  error,
  disabled,
}: {
  value: number;
  onChange: (newValue: number) => void;
  error: string | undefined;
  disabled?: boolean;
}) => {
  const inputCss = sliderBlockInputStyles;
  const styles = sliderBlockStyles;
  const [inputValue, setInputValue] = useState<string | number>(value);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value);
    }
  }, [value, isFocused]);

  return (
    <div className={clsx(styles.validatedInput, names.validatedInput)}>
      <Input
        type="text"
        value={inputValue}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const { value: newValue } = e.target;
          setInputValue(newValue);

          if (!isNaN(Number(newValue))) {
            onChange(Number(newValue));
          }
        }}
        className={clsx(inputCss.input, names.input)}
        hasError={Boolean(error)}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </div>
  );
};

const BlockSelectTrigger = () => {
  const styles = sliderBlockSelectStyles;
  return (
    <SelectTrigger className={clsx(styles.trigger, names.selectTrigger)}>
      <SelectValue />
    </SelectTrigger>
  );
};

export const SliderBlock = (props: SliderBlockProps) => {
  const {
    label,
    name,
    variant = "continuous",
    min = 0,
    max = 100,
    step,
    defaultValue,
    disabled,
    isStreaming,
    ...sliderProps
  } = props;

  const styles = sliderBlockStyles;
  const [value, setValue] = useState(defaultValue ?? [min]);

  const { min: minError, max: maxError } = useMemo(() => {
    const [minValue, maxValue] = value;
    const checkValue = (v: number) => {
      if (isNaN(v)) return "Invalid number";
      if (v < min || v > max) return `Value must be between ${min} and ${max}`;
      return "";
    };
    const error = { min: checkValue(minValue!), max: checkValue(maxValue!) };

    if (value.length > 1 && minValue! > maxValue!) {
      error.min = "Min must be less than max";
    }

    return error;
  }, [value, min, max]);

  const onValueCommitRef = useRef(sliderProps.onValueCommit);
  onValueCommitRef.current = sliderProps.onValueCommit;

  const debouncedOnValueCommit = useMemo(
    () =>
      debounce((newValue: number[]) => {
        onValueCommitRef.current?.(newValue);
      }, 200),
    [],
  );

  useEffect(() => {
    return () => {
      debouncedOnValueCommit.flush();
    };
  }, [debouncedOnValueCommit]);

  const setValueAndCommit = useCallback(
    (newValue: number[]) => {
      setValue(newValue);
      debouncedOnValueCommit(newValue);
    },
    [debouncedOnValueCommit],
  );

  useEffect(() => {
    setValue(defaultValue ?? [min]);
  }, [defaultValue, min]);

  const isRange = value.length > 1;
  const isDiscrete = variant === "discrete";
  const effectiveStep = isDiscrete ? (step ?? 1) : Math.max(1, step ?? 1);

  const controlElements = useMemo(() => {
    // `step` arrives last, so a discrete 500–10000 slider briefly reads as
    // step 1 — thousands of SelectItems, for a control that is disabled while
    // streaming anyway. No value control until the props settle.
    if (isStreaming) return null;
    if (isDiscrete) {
      const allOptions = Array.from(
        { length: Math.floor((max - min) / effectiveStep) + 1 },
        (_, i) => min + i * effectiveStep,
      );
      return isRange ? (
        <div className={clsx(styles.controls, names.controls)} data-range="">
          <div className={clsx(styles.controlContainer, names.selectContainer)}>
            <Select
              value={String(value[0])}
              disabled={disabled}
              onValueChange={(val) =>
                setValueAndCommit([Number(val), value[1] ?? max].sort((a, b) => a - b))
              }
            >
              <BlockSelectTrigger />
              <SelectContent>
                {allOptions
                  .filter((o) => o < (value[1] ?? max))
                  .map((o) => (
                    <SelectItem key={o} value={String(o)}>
                      {String(o)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className={clsx(styles.separator, names.separator)} />
            <Select
              value={String(value[1])}
              disabled={disabled}
              onValueChange={(val) =>
                setValueAndCommit([value[0] ?? min, Number(val)].sort((a, b) => a - b))
              }
            >
              <BlockSelectTrigger />
              <SelectContent>
                {allOptions
                  .filter((o) => o > (value[0] ?? min))
                  .map((o) => (
                    <SelectItem key={o} value={String(o)}>
                      {String(o)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className={clsx(styles.controls, names.controls)}>
          <Select
            value={String(value[0])}
            disabled={disabled}
            onValueChange={(val) => setValueAndCommit([Number(val)])}
          >
            <BlockSelectTrigger />
            <SelectContent>
              {allOptions.map((o) => (
                <SelectItem key={o} value={String(o)}>
                  {String(o)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    } else {
      return isRange ? (
        <div className={clsx(styles.controls, names.controls)} data-range="">
          <div className={clsx(styles.controlContainer, names.inputContainer)}>
            <ValueInput
              value={value[0] ?? min}
              onChange={(newMin) => setValueAndCommit([newMin, value[1] ?? max])}
              error={minError}
              disabled={disabled}
            />
            <div className={clsx(styles.separator, names.separator)} />
            <ValueInput
              value={value[1] ?? max}
              onChange={(newMax) => setValueAndCommit([value[0] ?? min, newMax])}
              error={maxError}
              disabled={disabled}
            />
          </div>
          {(minError || maxError) && (
            <div className={clsx(styles.error, names.error)}>
              <AlertCircle size={14} className={names.errorIcon} /> {minError || maxError}
            </div>
          )}
        </div>
      ) : (
        <div className={clsx(styles.controls, names.controls)}>
          <ValueInput
            value={value[0] ?? min}
            onChange={(newVal) => setValueAndCommit([newVal])}
            error={minError}
            disabled={disabled}
          />
          {minError && (
            <div className={clsx(styles.error, names.error)}>
              <AlertCircle size={14} className={names.errorIcon} />
              {minError}
            </div>
          )}
        </div>
      );
    }
  }, [
    isStreaming,
    isDiscrete,
    isRange,
    value,
    min,
    max,
    effectiveStep,
    minError,
    maxError,
    disabled,
    setValueAndCommit,
    styles,
  ]);

  const hasError =
    !isStreaming && !isDiscrete && (isRange ? Boolean(minError || maxError) : Boolean(minError));

  return (
    <div className={clsx(styles.root, names.root, names.variant[variant])}>
      <div className={clsx(styles.header, names.header)} data-invalid={hasError || undefined}>
        <span className={clsx(styles.label, names.label)}>{label}</span>
        {controlElements}
      </div>
      <div className={clsx(styles.content, names.content)}>
        <Slider
          {...sliderProps}
          value={value}
          onValueChange={(v) => {
            setValueAndCommit([...v].sort((a, b) => a - b));
          }}
          min={min}
          max={max}
          step={effectiveStep}
          // Dots are the only thing `variant` drives; `step` still reaches the
          // primitive, so suppressing them mid-stream keeps snapping intact.
          variant={isStreaming ? "continuous" : variant}
          name={name}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
