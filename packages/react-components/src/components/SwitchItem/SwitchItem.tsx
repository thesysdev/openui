"use client";

import * as Switch from "@radix-ui/react-switch";
import clsx from "clsx";
import { CSSProperties, forwardRef, ReactNode, useId } from "react";
import { names, switchItemStyles } from "./switchItem.styles";

interface SwitchItemProps {
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
  style?: CSSProperties;
  checked?: boolean;
  disabled?: boolean;
  defaultChecked?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  onChange?: (value: boolean) => void;
}

const SwitchItem = forwardRef<HTMLButtonElement, SwitchItemProps>((props, ref) => {
  const { label, description, onChange, className, disabled, required, ...rest } = props;
  const id = useId();
  const styles = switchItemStyles;
  return (
    <div className={clsx(styles.container, names.container)}>
      <Switch.Root
        ref={ref}
        onCheckedChange={onChange}
        id={id}
        className={clsx(styles.root, names.root, className)}
        disabled={disabled}
        required={required}
        {...rest}
      >
        <Switch.Thumb className={clsx(styles.thumb, names.thumb)} />
      </Switch.Root>
      <div className={names.content}>
        {label && (
          <label htmlFor={id} className={clsx(styles.label, names.label)}>
            {label}
          </label>
        )}
        {description && (
          <p className={clsx(styles.description, names.description)}>{description}</p>
        )}
      </div>
    </div>
  );
});

SwitchItem.displayName = "SwitchItem";

export { SwitchItem, type SwitchItemProps };
