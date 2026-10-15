import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";

export interface TextWithIconProps {
  icon: ReactNode;
  children: ReactNode;
  /** CSS font shorthand of the text, so the icon frame takes its line height. */
  font?: string;
  tone?: "primary" | "secondary";
  /** Text variant, so icon size and stroke track the text's size and weight. */
  variant?: string;
  emphasis?: boolean;
  className?: string;
}

/**
 * An icon in front of a line of text. The icon sits in a frame one text line
 * tall (1lh of the text's own font), so it centers on the first line at any
 * size. Icon size and stroke are balanced per variant so the icon reads at
 * the same weight as the text beside it.
 */
export const TextWithIcon = ({
  icon,
  children,
  font,
  tone,
  variant = "default",
  emphasis,
  className,
}: TextWithIconProps) => (
  <div
    className={clsx(
      "openui-text-with-icon",
      `openui-text-with-icon--${variant}`,
      emphasis && "openui-text-with-icon--emphasis",
      tone && `openui-text-with-icon--${tone}`,
      className,
    )}
  >
    <span
      className="openui-text-with-icon__frame"
      style={font ? ({ font } as CSSProperties) : undefined}
      aria-hidden
    >
      {icon}
    </span>
    <div className="openui-text-with-icon__text">{children}</div>
  </div>
);
