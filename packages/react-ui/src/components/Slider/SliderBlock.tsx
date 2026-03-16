import clsx from "clsx";
import debounce from "lodash-es/debounce";
import { AlertCircle } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "../Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Select";
import { Slider, SliderProps } from "./Slider";

export interface SliderBlockProps extends Omit<SliderProps, "value" | "defaultValue"> {
  label: string;
  defaultValue?: number[];
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
  const [inputValue, setInputValue] = useState<string | number>(value);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value);
    }
  }, [value, isFocused]);

  return (
    <div className="openui-slider-block__validated-input">
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
        className={clsx("openui-slider-block__input", {
          "openui-slider-block__input-error": error,
        })}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </div>
  );
};

export const SliderBlock = (props: SliderBlockProps) => {
  const {
    label,
    name,
    variant,
    min = 0,
    max = 100,
    step,
    defaultValue,
    disabled,
    ...sliderProps
  } = props;

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

  const onValueCommitRef = useRef((sliderProps as any)?.onValueCommit);
  onValueCommitRef.current = (sliderProps as any).onValueCommit;

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
    if (isDiscrete) {
      const allOptions = Array.from(
        { length: Math.floor((max - min) / effectiveStep) + 1 },
        (_, i) => min + i * effectiveStep,
      );
      return isRange ? (
        <div className="openui-slider-block__controls is-range">
          <div className="openui-slider-block__validated-select-container">
            <Select
              value={String(value[0])}
              disabled={disabled}
              onValueChange={(val) =>
                setValueAndCommit([Number(val), value[1] ?? max].sort((a, b) => a - b))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
            <div className="openui-slider-block__separator" />
            <Select
              value={String(value[1])}
              disabled={disabled}
              onValueChange={(val) =>
                setValueAndCommit([value[0] ?? min, Number(val)].sort((a, b) => a - b))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
        <div className="openui-slider-block__controls is-single">
          <Select
            value={String(value[0])}
            disabled={disabled}
            onValueChange={(val) => setValueAndCommit([Number(val)])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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
        <div className="openui-slider-block__controls openui-slider-block__controls--inputs is-range">
          <div className="openui-slider-block__validated-input-container">
            <ValueInput
              value={value[0] ?? min}
              onChange={(newMin) => setValueAndCommit([newMin, value[1] ?? max])}
              error={minError}
              disabled={disabled}
            />
            <div className="openui-slider-block__separator" />
            <ValueInput
              value={value[1] ?? max}
              onChange={(newMax) => setValueAndCommit([value[0] ?? min, newMax])}
              error={maxError}
              disabled={disabled}
            />
          </div>
          {(minError || maxError) && (
            <div className="openui-slider-block__error-message">
              <AlertCircle size={14} /> {minError || maxError}
            </div>
          )}
        </div>
      ) : (
        <div className="openui-slider-block__controls openui-slider-block__controls--inputs is-single">
          <ValueInput
            value={value[0] ?? min}
            onChange={(newVal) => setValueAndCommit([newVal])}
            error={minError}
            disabled={disabled}
          />
          {minError && (
            <div className="openui-slider-block__error-message">
              <AlertCircle size={14} />
              {minError}
            </div>
          )}
        </div>
      );
    }
  }, [
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
  ]);

  const hasError = !isDiscrete && (isRange ? Boolean(minError || maxError) : Boolean(minError));

  return (
    <div className="openui-slider-block">
      <div
        className={clsx("openui-slider-block__header", {
          "openui-slider-block__header--with-error": hasError,
        })}
      >
        <span className="openui-slider-block__label">{label}</span>
        {controlElements}
      </div>
      <div className="openui-slider-block__content">
        <Slider
          {...sliderProps}
          value={value}
          onValueChange={(v) => {
            setValueAndCommit([...v].sort((a, b) => a - b));
          }}
          min={min}
          max={max}
          step={effectiveStep}
          variant={variant}
          name={name}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
