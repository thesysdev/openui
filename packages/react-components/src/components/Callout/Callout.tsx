"use client";

import clsx from "clsx";
import React from "react";
import { calloutStyles, names } from "./callout.styles";

type CalloutVariant = "info" | "danger" | "warning" | "success" | "neutral";

export interface CalloutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: CalloutVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Auto-dismiss after N milliseconds. CSS-only fade + collapse. */
  duration?: number;
}

export const Callout = React.forwardRef<HTMLDivElement, CalloutProps>((props, ref) => {
  const styles = calloutStyles;
  const { className, variant = "neutral", title, description, duration, style, ...rest } = props;

  const dismissStyle = duration
    ? ({ ...style, "--_openui-callout-duration": `${duration}ms` } as React.CSSProperties)
    : style;

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
      data-autodismiss={duration ? "true" : undefined}
      style={dismissStyle}
      {...rest}
    >
      {title && <span className={clsx(styles.title, names.title)}>{title}</span>}
      {description && (
        <span className={clsx(styles.description, names.description)}>{description}</span>
      )}
    </div>
  );
});
