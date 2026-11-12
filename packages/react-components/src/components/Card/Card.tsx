"use client";

import clsx from "clsx";
import React from "react";
import { cardStyles, names } from "./card.styles";

type CardVariant = "clear" | "card" | "sunk";
type CardWidth = "standard" | "full";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  width?: CardWidth;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const { className, children, variant = "card", width = "standard", ...rest } = props;

  const styles = cardStyles;
  return (
    <div
      ref={ref}
      className={clsx(
        styles.root,
        names.root,
        className,
        styles.variant[variant],
        names.variant[variant],
        styles.width[width],
        names.width[width],
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";
