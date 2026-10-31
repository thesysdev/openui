"use client";

import clsx from "clsx";
import debounce from "lodash-es/debounce.js";
import { DetailedHTMLProps, SelectHTMLAttributes, useEffect, useState } from "react";
import { ClassNames, CustomComponents, DropdownOption } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type SelectContentProps,
  type SelectItemProps,
  type SelectTriggerProps,
} from "../../Select";
import { calendarDropdownStyles, names } from "../calendar.styles";
import { getMonthName, getMonthNumber } from "../utils/helperFn";

const CalendarSelectTrigger = ({ className, ...props }: SelectTriggerProps) => {
  const styles = calendarDropdownStyles;
  return (
    <SelectTrigger
      {...props}
      className={clsx(styles.selectTrigger, names.selectTrigger, className)}
    />
  );
};
const CalendarSelectContent = ({
  kind,
  ...props
}: SelectContentProps & { kind: "months" | "years" }) => {
  const styles = calendarDropdownStyles;
  return (
    <SelectContent
      {...props}
      className={clsx(
        kind === "months"
          ? [styles.selectContentMonths, names.selectContentMonths]
          : [styles.selectContentYears, names.selectContentYears],
      )}
      viewportClassName={
        kind === "years" ? clsx(styles.selectViewport, names.selectViewport) : undefined
      }
    />
  );
};
const CalendarSelectItem = (props: SelectItemProps) => {
  const styles = calendarDropdownStyles;
  return <SelectItem {...props} className={clsx(styles.selectItem, names.selectItem)} />;
};

export const MonthsDropdown = (
  props: {
    classNames: ClassNames;
    components: CustomComponents;
    options?: DropdownOption[];
  } & Omit<
    DetailedHTMLProps<SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>,
    "children"
  > & {
      container?: HTMLDivElement | null;
    },
) => {
  const {
    className,
    disabled,
    onChange,
    options,
    value,
    key,
    "aria-label": ariaLabel,
    container,
  } = props;

  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (!container) return;

    const targetElement = container.children[0]?.children[0];
    if (!targetElement) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        const { width, height } = entries[0]?.contentRect || {};
        setContainerWidth(width || 0);
        setContainerHeight(height || 0);
      }, 100),
    );

    resizeObserver.observe(targetElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [container]);

  return (
    <Select
      onValueChange={(value) =>
        onChange?.({
          target: { value: getMonthNumber(value) },
        } as any)
      }
      value={getMonthName(Number(value))}
      disabled={disabled}
      key={key}
      aria-label={ariaLabel}
    >
      <CalendarSelectTrigger className={className} aria-label={ariaLabel}>
        <SelectValue placeholder={"Select a month"} />
      </CalendarSelectTrigger>
      <CalendarSelectContent
        container={container}
        kind="months"
        sideOffset={4}
        alignOffset={0}
        style={{
          maxHeight: `${containerHeight - 45}px`,
          minWidth: `${containerWidth}px`,
        }}
      >
        {options?.map((option) => (
          <SelectItem
            key={option.value}
            value={getMonthName(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </CalendarSelectContent>
    </Select>
  );
};

export const YearsDropdown = (
  props: {
    classNames: ClassNames;
    components: CustomComponents;
    options?: DropdownOption[];
  } & Omit<
    DetailedHTMLProps<SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>,
    "children"
  > & {
      container?: HTMLDivElement | null;
    },
) => {
  const {
    className,
    disabled,
    onChange,
    options,
    value,
    key,
    "aria-label": ariaLabel,
    container,
  } = props;

  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (!container) return;

    const targetElement = container.children[0]?.children[0];
    if (!targetElement) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        const { height } = entries[0]?.contentRect || {};
        setContainerHeight(height || 0);
      }, 100),
    );

    resizeObserver.observe(targetElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [container]);

  return (
    <Select
      onValueChange={(value) =>
        onChange?.({
          target: { value: Number(value) },
        } as any)
      }
      value={String(value)}
      disabled={disabled}
      key={key}
      aria-label={ariaLabel}
    >
      <CalendarSelectTrigger className={className} aria-label={ariaLabel}>
        <SelectValue placeholder={"Select a month"} />
      </CalendarSelectTrigger>
      <CalendarSelectContent
        container={container}
        kind="years"

        sideOffset={4}
        alignOffset={-75}
        style={{
          minHeight: `${containerHeight - 45}px`,
          maxHeight: `${containerHeight - 45}px`,
        }}
      >
        {options?.map((option) => (
          <CalendarSelectItem
            key={option.value}
            value={String(option.value)}
            disabled={option.disabled}
            showTick={false}
          >
            {option.label}
          </CalendarSelectItem>
        ))}
      </CalendarSelectContent>
    </Select>
  );
};
