"use client";

import * as Radio from "@radix-ui/react-radio-group";
import clsx from "clsx";
import { CSSProperties, forwardRef, ReactNode, useId } from "react";
import { names, radioItemStyles } from "./radioItem.styles";

export interface RadioItemProps {
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  required?: boolean;
  value: string;
}

const RadioItem = forwardRef<HTMLButtonElement, RadioItemProps>((props, ref) => {
  const { label, description, className, style, disabled, required, value } = props;
  const id = useId();
  const styles = radioItemStyles;
  return (
    <label htmlFor={id} className={clsx(styles.container, names.container)}>
      <Radio.Item
        ref={ref}
        id={id}
        className={clsx(styles.root, names.root, className)}
        value={value}
        disabled={disabled}
        required={required}
        style={style}
      >
        <svg
          width={16}
          height={16}
          fill="none"
          viewBox="0 0 16 16"
          className={clsx(styles.svg, names.svg)}
        >
          <path // This is the circle that is filled between the border and the circle
            fill="currentColor"
            d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Z"
            className={clsx(styles.path, names.path)}
          />
          <path // This is the border
            stroke="currentColor"
            d="M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Z"
            className={clsx(styles.border, names.border)}
          />
          <path // This is the inner circle
            fill="currentColor"
            d="M4 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
            className={clsx(styles.inner, names.inner)}
          />
        </svg>
      </Radio.Item>
      <div className={clsx(styles.content, names.content)}>
        {label && (
          <label htmlFor={id} className={clsx(styles.label, names.label)}>
            {label}
          </label>
        )}
        {description && (
          <p className={clsx(styles.description, names.description)}>{description}</p>
        )}
      </div>
    </label>
  );
});

RadioItem.displayName = "RadioItem";

export { RadioItem };
