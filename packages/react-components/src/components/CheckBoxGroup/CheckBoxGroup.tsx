"use client";

import clsx from "clsx";
import React from "react";
import { CheckBoxItemProps } from "../CheckBoxItem";
import { checkBoxGroupStyles, names } from "./checkBoxGroup.styles";

type CheckBoxGroupVariant = "clear" | "card" | "sunk";

interface CheckBoxGroupProps {
  children: React.ReactElement<CheckBoxItemProps> | React.ReactElement<CheckBoxItemProps>[];
  className?: string;
  style?: React.CSSProperties;
  variant?: CheckBoxGroupVariant;
}

const CheckBoxGroup = React.forwardRef<HTMLDivElement, CheckBoxGroupProps>((props, ref) => {
  const { children, className, style, variant = "clear" } = props;
  const styles = checkBoxGroupStyles;
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
      style={style}
    >
      {children}
    </div>
  );
});

CheckBoxGroup.displayName = "CheckBoxGroup";

export { CheckBoxGroup, type CheckBoxGroupProps };
