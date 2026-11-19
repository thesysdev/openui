"use client";

import clsx from "clsx";
import { CSSProperties, ReactNode } from "react";
import { names, textContentStyles } from "./textContent.styles";

export type TextContentVariant = "clear" | "card" | "sunk";

export interface TextContentProps {
  children: ReactNode;
  variant?: TextContentVariant;
  className?: string;
  style?: CSSProperties;
}

const TextContent = (props: TextContentProps) => {
  const { children, variant = "sunk", className, style } = props;

  const css = textContentStyles;
  return (
    <div
      className={clsx(
        css.root,
        names.root,
        css.variant[variant],
        names.variant[variant],
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
};

export { TextContent };
