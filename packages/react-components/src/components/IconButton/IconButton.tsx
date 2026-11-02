"use client";

import { Slot, Slottable } from "@radix-ui/react-slot";
import clsx from "clsx";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { iconButtonStyles, names } from "./iconButton.styles";

type IconButtonVariant = "primary" | "secondary" | "tertiary";
type IconButtonSize =
  "3-extra-small" | "2-extra-small" | "extra-small" | "small" | "medium" | "large";
type IconButtonShape = "square" | "circle";
type IconButtonTone = "default" | "destructive";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  className?: string;
  /** What the action means to the user; `destructive` colours it as a dangerous action. */
  tone?: IconButtonTone;
  /**
   * Render as the provided child element instead of a `<button>`. Useful when the
   * icon button is nested inside another interactive element (e.g. an accordion
   * trigger) where a nested `<button>` would be invalid HTML.
   */
  asChild?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
  const {
    className,
    icon,
    variant = "primary",
    size = "medium",
    shape = "square",
    tone = "default",
    asChild = false,
    children,
    ...rest
  } = props;
  const styles = iconButtonStyles;

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      className={clsx(
        styles.root,
        styles.variant[variant],
        styles.size[size],
        styles.shape[shape],
        styles.tone[tone],
        names.root,
        names.variant[variant],
        names.size[size],
        names.shape[shape],
        names.tone[tone],
        className,
      )}
      {...rest}
    >
      <Slottable>{children}</Slottable>
      {icon && <span className={clsx(styles.icon, names.icon)}>{icon}</span>}
    </Comp>
  );
});

IconButton.displayName = "IconButton";
