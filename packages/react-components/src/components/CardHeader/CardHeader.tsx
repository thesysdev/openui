"use client";

import clsx from "clsx";
import { cloneElement, CSSProperties, forwardRef, ReactElement, ReactNode } from "react";
import { ButtonProps } from "../Button";
import { IconButtonProps } from "../IconButton";
import { cardHeaderStyles, names } from "./cardHeader.styles";

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?:
    ReactElement<ButtonProps | IconButtonProps> | ReactElement<ButtonProps | IconButtonProps>[];
  className?: string;
  styles?: CSSProperties;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>((props, ref) => {
  const { icon, title, subtitle, actions, className, styles: inlineStyles, ...rest } = props;
  const styles = cardHeaderStyles;
  return (
    <div
      ref={ref}
      className={clsx(styles.root, names.root, className)}
      style={inlineStyles}
      {...rest}
    >
      <div className={clsx(styles.top, names.top)}>
        <div className={clsx(styles.topLeft, names.topLeft)}>
          {icon && <span className={clsx(styles.topLeftIcon, names.topLeftIcon)}>{icon}</span>}
          {title}
        </div>
        <div className={clsx(styles.topRight, names.topRight)}>
          {Array.isArray(actions)
            ? actions.map((action, index) => cloneElement(action, { key: index }))
            : actions}
        </div>
      </div>
      {subtitle && <div className={clsx(styles.bottom, names.bottom)}>{subtitle}</div>}
    </div>
  );
});

CardHeader.displayName = "CardHeader";
