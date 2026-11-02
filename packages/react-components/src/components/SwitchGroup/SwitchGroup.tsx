"use client";

import clsx from "clsx";
import { CSSProperties, forwardRef, ReactElement } from "react";
import { SwitchItemProps } from "../SwitchItem";
import { names, switchGroupStyles } from "./switchGroup.styles";

type SwitchGroupVariant = "clear" | "card" | "sunk";
export interface SwitchGroupProps {
  children: ReactElement<SwitchItemProps> | ReactElement<SwitchItemProps>[];
  className?: string;
  style?: CSSProperties;
  variant?: SwitchGroupVariant;
}

const SwitchGroup = forwardRef<HTMLDivElement, SwitchGroupProps>((props, ref) => {
  const { children, className, style, variant = "clear" } = props;
  const styles = switchGroupStyles;
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

SwitchGroup.displayName = "SwitchGroup";

export { SwitchGroup };
