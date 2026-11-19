"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";
import React, { createContext, forwardRef, useContext, useEffect, useMemo, useState } from "react";
import { useTheme } from "../ThemeProvider";
import { names, selectStyles } from "./select.styles";

type SelectSize = "sm" | "md" | "lg";
interface SelectSizeContextType {
  size: SelectSize;
  setSize: (size: SelectSize) => void;
}
const SelectSizeContext = createContext<SelectSizeContextType | null>(null);
const useSelectSizeContext = () => useContext(SelectSizeContext);

export interface SelectProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> {
  size?: SelectSize;
}
export const Select = ({ size = "md", ...props }: SelectProps) => {
  const [currentSize, setCurrentSize] = useState<SelectSize>(size);
  useEffect(() => {
    setCurrentSize(size);
  }, [size]);
  const contextValue = useMemo(
    () => ({ size: currentSize, setSize: setCurrentSize }),
    [currentSize],
  );
  return (
    <SelectSizeContext.Provider value={contextValue}>
      <SelectPrimitive.Root {...props} />
    </SelectSizeContext.Provider>
  );
};

export interface SelectGroupProps extends React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Group
> {}
export const SelectGroup = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Group>,
  SelectGroupProps
>(({ className, ...props }, ref) => {
  const styles = selectStyles;
  return (
    <SelectPrimitive.Group
      ref={ref}
      className={clsx(styles.group, names.group, className)}
      {...props}
    />
  );
});

// Radix Value deliberately discards className/style. The owned span supplies an override target
// while Radix keeps its value node and selected-item text portal intact.
export const SelectValue = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(({ className, style, ...props }, ref) => (
  <span ref={ref} className={clsx(names.value, className)} style={style}>
    <SelectPrimitive.Value {...props} />
  </span>
));

export interface SelectTriggerProps extends React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Trigger
> {
  hideDropdownIcon?: boolean;
  size?: SelectSize;
}
export const SelectTrigger = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, children, hideDropdownIcon, size, ...props }, ref) => {
  const styles = selectStyles;
  const sizeContext = useSelectSizeContext();
  const resolvedSize = size ?? sizeContext?.size ?? "md";
  useEffect(() => {
    if (sizeContext && sizeContext.size !== resolvedSize) sizeContext.setSize(resolvedSize);
  }, [resolvedSize, sizeContext]);
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={clsx(
        styles.trigger,
        names.trigger,
        styles.size[resolvedSize],
        names.size[resolvedSize],
        hideDropdownIcon && names.hideDropdownIcon.true,
        className,
      )}
      {...props}
    >
      {children}
      {!hideDropdownIcon && (
        <SelectPrimitive.Icon asChild>
          <ChevronDown className={clsx(styles.triggerIcon, names.triggerIcon)} />
        </SelectPrimitive.Icon>
      )}
    </SelectPrimitive.Trigger>
  );
});

export interface SelectContentProps extends React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Content
> {
  /** Portal destination; defaults to document.body. */
  container?: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Portal>["container"];
  /** Additional class for the owned scrolling viewport. */
  viewportClassName?: string;
}
export const SelectContent = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(
  (
    {
      className,
      children,
      position = "popper",
      container,
      viewportClassName,
      style,
      sideOffset = 2,
      ...props
    },
    ref,
  ) => {
    const styles = selectStyles;
    const { portalThemeClassName } = useTheme();
    const size = useSelectSizeContext()?.size ?? "md";
    return (
      <SelectPrimitive.Portal container={container}>
        <SelectPrimitive.Content
          ref={ref}
          className={clsx(
            styles.content,
            names.content,
            styles.contentSize[size],
            names.contentSize[size],
            styles.position[position],
            names.position[position],
            className,
            portalThemeClassName,
          )}
          position={position}
          sideOffset={sideOffset}
          // Radix sets these static defaults inline. Keep them in the flat CSS instead.
          style={{
            display: undefined,
            flexDirection: undefined,
            outline: undefined,
            boxSizing: undefined,
            maxHeight: undefined,
            ...style,
          }}
          {...props}
        >
          <SelectPrimitive.Viewport
            className={clsx(styles.viewport, names.viewport, viewportClassName)}
            data-position={position}
            style={{ position: undefined, flex: undefined, overflow: undefined }}
          >
            {children}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    );
  },
);

export interface SelectLabelProps extends React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Label
> {}
export const SelectLabel = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  SelectLabelProps
>(({ className, ...props }, ref) => {
  const styles = selectStyles;
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={clsx(styles.label, names.label, className)}
      {...props}
    />
  );
});

export interface SelectItemProps extends React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Item
> {
  showTick?: boolean;
}
export const SelectItem = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ className, children, showTick = true, textValue, ...props }, ref) => {
  const styles = selectStyles;
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={clsx(
        styles.item,
        names.item,
        showTick && [styles.showTick, names.showTick.true],
        className,
      )}
      {...props}
    >
      {showTick && (
        <span className={clsx(styles.checkWrapper, names.checkWrapper)}>
          <SelectPrimitive.ItemIndicator className={names.indicator}>
            <Check className={clsx(styles.checkIcon, names.checkIcon)} />
          </SelectPrimitive.ItemIndicator>
        </span>
      )}
      <SelectPrimitive.ItemText asChild>
        <span className={names.itemText}>{children}</span>
      </SelectPrimitive.ItemText>
      {textValue && <span className={names.textValue}>{textValue}</span>}
    </SelectPrimitive.Item>
  );
});

export interface SelectSeparatorProps extends React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Separator
> {}
export const SelectSeparator = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  SelectSeparatorProps
>(({ className, ...props }, ref) => {
  const styles = selectStyles;
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={clsx(styles.separator, names.separator, className)}
      {...props}
    />
  );
});
