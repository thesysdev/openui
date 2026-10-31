"use client";

import clsx from "clsx";
import React from "react";
import { names, textCalloutStyles } from "./textCallout.styles";

type TextCalloutVariant = "neutral" | "info" | "warning" | "success" | "danger";

export interface TextCalloutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: TextCalloutVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export const TextCallout = React.forwardRef<HTMLDivElement, TextCalloutProps>((props, ref) => {
  const styles = textCalloutStyles;
  const { className, variant = "neutral", title, description, ...rest } = props;

  return (
    <div
      ref={ref}
      className={clsx(
        styles.root,
        names.root,
        styles.variant[variant],
        names.variant[variant],
        className,
      )}
      {...rest}
    >
      <div className={clsx(styles.content, names.content)}>
        {title && <span className={clsx(styles.title, names.title)}>{title}</span>}
        {description && (
          <span className={clsx(styles.description, names.description)}>{description}</span>
        )}
      </div>
    </div>
  );
});
