"use client";

import clsx from "clsx";
import React, { forwardRef } from "react";
import { useFormControlContext } from "../context";
import { hintStyles, names } from "./hint.styles";

export interface HintProps extends React.ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hasError?: boolean;
}

const Hint = forwardRef<HTMLDivElement, HintProps>(
  ({ children, className, style, hasError, ...props }, ref) => {
    const styles = hintStyles;
    const ctx = useFormControlContext();
    const resolvedHasError = hasError ?? ctx?.hasError ?? false;
    return (
      <div
        ref={ref}
        className={clsx(styles.root, names.root, className)}
        data-invalid={resolvedHasError || undefined}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Hint.displayName = "Hint";

export { Hint };
