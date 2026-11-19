"use client";

import clsx from "clsx";
import React, { forwardRef, useMemo } from "react";
import { names as baseNames, baseStyles } from "../SharedBase/base.styles";
import { FormControlProvider } from "./context";
import { formControlStyles, names } from "./formControl.styles";
export interface FormControlProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hasError?: boolean;
}

const FormControl = forwardRef<HTMLDivElement, FormControlProps>((props, ref) => {
  const { children, className, style, hasError = false } = props;
  const styles = formControlStyles;
  const base = baseStyles;
  const formControlContextValue = useMemo(() => ({ hasError }), [hasError]);
  return (
    <div
      ref={ref}
      className={clsx(styles.root, names.root, base.root, baseNames.root, className)}
      style={style}
    >
      <FormControlProvider value={formControlContextValue}>{children}</FormControlProvider>
    </div>
  );
});

FormControl.displayName = "FormControl";

export { FormControl };
