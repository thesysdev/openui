"use client";

import clsx from "clsx";
import React, { forwardRef } from "react";
import { useFormControlContext } from "../FormControl/context";
import { names, textAreaStyles } from "./textArea.styles";

export interface TextAreaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "size"
> {
  className?: string;
  placeholder?: string;
  rows?: number;
  hasError?: boolean;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>((props, ref) => {
  const { className, rows = 3, hasError, ...rest } = props;
  const styles = textAreaStyles;
  const ctx = useFormControlContext();
  const resolvedHasError = hasError ?? ctx?.hasError ?? false;

  return (
    <textarea
      ref={ref}
      className={clsx(styles.root, names.root, className)}
      aria-invalid={resolvedHasError || undefined}
      {...rest}
      rows={rows}
    />
  );
});

TextArea.displayName = "TextArea";

export { TextArea };
