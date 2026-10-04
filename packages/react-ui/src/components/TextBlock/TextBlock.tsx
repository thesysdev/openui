import clsx from "clsx";
import { forwardRef } from "react";
import { InlineMarkdownRenderer } from "../InlineMarkdownRenderer";

export type TextBlockVariant =
  | "title-text"
  | "number-title-text"
  | "text-subtext"
  | "highlight-text-number-subtext"
  | "text"
  | "highlight-text"
  | "number"
  | "highlight-number";

export type TextBlockType = "text" | "number" | "textOnly";
export type TextBlockSize = "xs" | "sm" | "md" | "lg";
export type TextBlockAlign = "left" | "center" | "right";
export type TextBlockSecondaryTone = "positive" | "negative";

export interface TextBlockViewProps {
  primary: string;
  secondary?: string;
  tertiary?: string;
  variant?: TextBlockVariant;
  type?: TextBlockType;
  size?: TextBlockSize;
  align?: TextBlockAlign;
  secondaryMaxLines?: number;
  secondaryTone?: TextBlockSecondaryTone;
  className?: string;
}

/**
 * Low-level text primitive for card content: a primary line with optional
 * secondary/tertiary lines. `variant`, `size`, `type` and `align` control
 * emphasis, spacing and number styling.
 */
export const TextBlockView = forwardRef<HTMLDivElement, TextBlockViewProps>(
  (
    {
      primary,
      secondary,
      tertiary,
      variant = "title-text",
      type = "text",
      size = "sm",
      align = "left",
      secondaryMaxLines,
      secondaryTone,
      className,
    },
    ref,
  ) => {
    const secondaryClassName = clsx(
      "openui-text-block__secondary",
      secondaryTone && `openui-text-block__secondary--${secondaryTone}`,
    );
    const secondaryStyle =
      secondaryMaxLines !== undefined
        ? {
            display: "-webkit-box",
            WebkitLineClamp: secondaryMaxLines,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }
        : undefined;

    return (
      <div
        ref={ref}
        className={clsx(
          "openui-text-block",
          `openui-text-block--${variant}`,
          `openui-text-block--size-${size}`,
          `openui-text-block--align-${align}`,
          `openui-text-block--type-${type}`,
          className,
        )}
      >
        <InlineMarkdownRenderer content={primary} className="openui-text-block__primary" />
        {secondary &&
          (secondaryStyle ? (
            // The line-clamp style needs its own block element — the markdown
            // renderer has no style passthrough.
            <div className={secondaryClassName} style={secondaryStyle}>
              <InlineMarkdownRenderer content={secondary} />
            </div>
          ) : (
            <InlineMarkdownRenderer content={secondary} className={secondaryClassName} />
          ))}
        {tertiary && (
          <InlineMarkdownRenderer content={tertiary} className="openui-text-block__tertiary" />
        )}
      </div>
    );
  },
);

TextBlockView.displayName = "TextBlockView";
