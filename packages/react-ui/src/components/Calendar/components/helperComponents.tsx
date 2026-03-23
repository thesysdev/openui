import * as SelectPrimitive from "@radix-ui/react-select";
import clsx from "clsx";
import debounce from "lodash-es/debounce";
import { DetailedHTMLProps, forwardRef, SelectHTMLAttributes, useEffect, useState } from "react";
import { ClassNames, CustomComponents, DropdownOption } from "react-day-picker";
import { Select, SelectItem, SelectTrigger, SelectValue } from "../../Select";
import { getMonthName, getMonthNumber } from "../utils/helperFn";

// this component is overriding the default SelectContent component to allow for a container prop we do not wish to give to the user
const SelectContent = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    container?: HTMLDivElement | null;
    viewportClassName?: string;
  }
>(({ className, children, position = "popper", viewportClassName, container, ...props }, ref) => (
  <SelectPrimitive.Portal container={container || document.body}>
    <SelectPrimitive.Content
      ref={ref}
      className={clsx("openui-select-content", className)}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={clsx("openui-select-viewport", viewportClassName)}
        data-position={position}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));

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
      <SelectTrigger className={clsx("openui-calendar-select-trigger", className)}>
        <SelectValue placeholder={"Select a month"} />
      </SelectTrigger>
      <SelectContent
        container={container}
        className="openui-calendar-select-content-months"
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
      </SelectContent>
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
      botType: "mobile" | "fullscreen" | "tray" | "copilot";
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
    botType,
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
      <SelectTrigger className={clsx("openui-calendar-select-trigger", className)}>
        <SelectValue placeholder={"Select a month"} />
      </SelectTrigger>
      <SelectContent
        container={container}
        className="openui-calendar-select-content-years"
        viewportClassName={clsx(
          "openui-calendar-select-viewport",
          botType === "mobile" && "openui-calendar-select-viewport-mobile",
        )}
        sideOffset={4}
        alignOffset={-75}
        style={{
          minHeight: `${containerHeight - 45}px`,
          maxHeight: `${containerHeight - 45}px`,
        }}
      >
        {options?.map((option) => (
          <SelectItem
            key={option.value}
            value={String(option.value)}
            disabled={option.disabled}
            showTick={false}
            className="openui-calendar-select-item"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
