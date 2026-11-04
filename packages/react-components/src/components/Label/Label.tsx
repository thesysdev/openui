"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import clsx from "clsx";
import React, { forwardRef } from "react";
import { labelStyles, names } from "./label.styles";

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  required?: boolean;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, className, style, disabled, required, ...props }, ref) => {
    const styles = labelStyles;
    return (
      <LabelPrimitive.Root
        ref={ref}
        className={clsx(styles.root, names.root, className)}
        aria-disabled={disabled || undefined}
        style={style}
        {...props}
      >
        {children}
        {required && (
          <span className={clsx(styles.requiredAsterisk, names.requiredAsterisk)}>*</span>
        )}
      </LabelPrimitive.Root>
    );
  },
);

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
