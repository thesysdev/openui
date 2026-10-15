import clsx from "clsx";
import React from "react";

// "clear" is internal only (the chat response wrapper); generated UI picks outlined, lifted or sunk.
type CardVariant = "clear" | "outlined" | "lifted" | "sunk";
type CardWidth = "standard" | "full";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  width?: CardWidth;
}

const variantMap: Record<CardVariant, string> = {
  clear: "openui-card-clear",
  outlined: "openui-card-outlined",
  lifted: "openui-card-lifted",
  sunk: "openui-card-sunk",
};

const widthMap: Record<CardWidth, string> = {
  standard: "openui-card-standard",
  full: "openui-card-full",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const { className, children, variant = "outlined", width = "standard", ...rest } = props;

  return (
    <div
      ref={ref}
      className={clsx("openui-card", className, variantMap[variant], widthMap[width])}
      {...rest}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";
