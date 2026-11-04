"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import clsx from "clsx";
import { forwardRef, ReactNode, useState } from "react";
import { names, sliderStyles } from "./slider.styles";

const formatNumber = (num: number | undefined): string => {
  if (num === undefined) {
    return "";
  }
  // format number to k, m, b
  if (num >= 1000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    })
      .format(num)
      .toLowerCase();
  }
  return String(num);
};

export interface SliderProps extends Omit<
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
  "value" | "defaultValue"
> {
  variant: "continuous" | "discrete";
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  value?: number[];
  defaultValue?: number[];
  className?: string;
  style?: React.CSSProperties;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
}

export const Slider = forwardRef<React.ComponentRef<typeof SliderPrimitive.Root>, SliderProps>(
  (
    {
      variant = "continuous",
      min,
      max,
      step,
      disabled,
      value,
      defaultValue,
      onValueChange,
      className,
      style,
      leftContent,
      rightContent,
      ...props
    },
    ref,
  ) => {
    const styles = sliderStyles;
    // used to show the correct value on thumb
    const [internalValue, setInternalValue] = useState(
      defaultValue && defaultValue.length > 0 ? defaultValue : [min],
    );

    const isControlled = value !== undefined;
    const valueToShow = isControlled ? value : internalValue;

    const isRange = valueToShow && valueToShow.length > 1;

    const thumbs = (isRange ? valueToShow : [valueToShow[0]]).map((v, i) => (
      <SliderPrimitive.Thumb key={i} className={clsx(styles.thumb, names.thumb)}>
        <div className={clsx(styles.handle, names.handle)}>
          <div className={clsx(styles.handleInner, names.handleInner)}>
            <div className={clsx(styles.handleDot, names.handleDot)} />
          </div>
          {!disabled && <div className={clsx(styles.value, names.value)}>{formatNumber(v)}</div>}
        </div>
      </SliderPrimitive.Thumb>
    ));

    const renderDots = () => {
      if (variant === "discrete" && step) {
        const numSteps = Math.floor((max - min) / step);
        const currentValue = valueToShow?.[0] ?? min;

        return Array.from({ length: numSteps + 1 }, (_, index) => {
          const value = min + step * index;
          const position = ((value - min) / (max - min)) * 100;
          const isActive = isRange
            ? value >= (valueToShow?.[0] ?? min) && value <= (valueToShow?.[1] ?? max)
            : value <= currentValue;

          return (
            <div
              key={value}
              className={clsx(styles.mark, names.mark)}
              data-state={isActive ? "active" : "inactive"}
              style={{ left: `${position}%` }}
            />
          );
        });
      }
      return null;
    };

    return (
      <div className={clsx(styles.wrapper, names.wrapper)}>
        {leftContent && (
          <div className={clsx(styles.leftContent, names.leftContent)}>{leftContent}</div>
        )}
        <div className={clsx(styles.containerWrapper, names.containerWrapper)}>
          <div className={clsx(styles.container, names.container)}>
            <SliderPrimitive.Root
              ref={ref}
              className={clsx(styles.root, names.root, names.variant[variant], className)}
              {...props}
              min={min}
              max={max}
              step={step}
              value={valueToShow}
              onValueChange={(val) => {
                if (!isControlled) {
                  setInternalValue(val);
                }
                onValueChange?.(val);
              }}
              minStepsBetweenThumbs={1}
              disabled={disabled}
              key={variant}
              style={style}
            >
              <SliderPrimitive.Track className={clsx(styles.track, names.track)}>
                <SliderPrimitive.Range
                  className={clsx(styles.range, names.range)}
                  data-at-min={!isRange && valueToShow?.[0] === min ? "" : undefined}
                />
                {variant === "discrete" && renderDots()}
              </SliderPrimitive.Track>
              {thumbs}
            </SliderPrimitive.Root>
          </div>
          <div className={clsx(styles.labels, names.labels)}>
            <span className={names.label}>{formatNumber(min)}</span>
            <span className={names.label}>{formatNumber(max)}</span>
          </div>
        </div>
        {rightContent && (
          <div className={clsx(styles.leftContent, names.rightContent)}>{rightContent}</div>
        )}
      </div>
    );
  },
);
