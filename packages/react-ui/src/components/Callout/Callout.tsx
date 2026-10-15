import clsx from "clsx";
import React from "react";

type CalloutVariant =
  "info" | "danger" | "warning" | "success" | "neutral" | "purple" | "pink" | "inverted";

export interface CalloutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: CalloutVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Leading icon, centered on the title's first line. */
  icon?: React.ReactNode;
  /** Auto-dismiss after N milliseconds. CSS-only fade + collapse. */
  duration?: number;
}

const variantMap: Record<CalloutVariant, string> = {
  info: "openui-callout-info",
  danger: "openui-callout-danger",
  warning: "openui-callout-warning",
  success: "openui-callout-success",
  neutral: "openui-callout-neutral",
  purple: "openui-callout-purple",
  pink: "openui-callout-pink",
  inverted: "openui-callout-inverted",
};

export const Callout = React.forwardRef<HTMLDivElement, CalloutProps>((props, ref) => {
  const {
    className,
    variant = "neutral",
    title,
    description,
    icon,
    duration,
    style,
    ...rest
  } = props;

  const dismissStyle = duration
    ? ({ ...style, "--callout-duration": `${duration}ms` } as React.CSSProperties)
    : style;

  return (
    <div
      ref={ref}
      className={clsx(
        "openui-callout",
        variantMap[variant],
        duration && "openui-callout-autodismiss",
        className,
      )}
      style={dismissStyle}
      {...rest}
    >
      {icon && (
        <span className="openui-callout-icon" aria-hidden>
          {icon}
        </span>
      )}
      <div className="openui-callout-body">
        {title && <span className="openui-callout-title">{title}</span>}
        {description && <span className="openui-callout-description">{description}</span>}
      </div>
    </div>
  );
});
