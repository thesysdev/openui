import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";

export interface HeadingTextStyle {
  font: string;
  axis: string;
  letterSpacing: string;
}

export interface HeadingProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  titleStyle: HeadingTextStyle;
  descriptionStyle: HeadingTextStyle;
  size?: "default" | "lg";
  className?: string;
}

const toStyle = (s: HeadingTextStyle): CSSProperties => ({
  font: s.font,
  fontVariationSettings: s.axis,
  letterSpacing: s.letterSpacing,
});

/** A title with an optional supporting line underneath, and an optional icon. */
export const Heading = ({
  title,
  description,
  icon,
  titleStyle,
  descriptionStyle,
  size = "default",
  className,
}: HeadingProps) => (
  <div className={clsx("openui-heading", `openui-heading--${size}`, className)}>
    <div className="openui-heading__title-row">
      {icon && (
        <span className="openui-heading__icon" style={{ font: titleStyle.font }} aria-hidden>
          {icon}
        </span>
      )}
      <div className="openui-heading__title" style={toStyle(titleStyle)}>
        {title}
      </div>
    </div>
    {description && (
      <div className="openui-heading__description" style={toStyle(descriptionStyle)}>
        {description}
      </div>
    )}
  </div>
);
