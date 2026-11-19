"use client";

import clsx from "clsx";
import React from "react";
import { useFormControlContext } from "../FormControl/context";
import { inputStyles, names } from "./input.styles";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  styles?: React.CSSProperties;
  className?: string;
  size?: "small" | "medium" | "large";
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, styles, size = "medium", hasError, ...props }, ref) => {
    const css = inputStyles;
    const ctx = useFormControlContext();
    const resolvedHasError = hasError ?? ctx?.hasError ?? false;
    return (
      <input
        autoComplete="off"
        ref={ref}
        className={clsx(css.root, css.size[size], names.root, names.size[size], className)}
        aria-invalid={resolvedHasError || undefined}
        style={styles}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
