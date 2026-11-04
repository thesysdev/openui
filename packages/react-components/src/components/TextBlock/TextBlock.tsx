"use client";

import clsx from "clsx";
import { forwardRef, useContext } from "react";
import { InlineMarkdownRenderer } from "../InlineMarkdownRenderer";
import { names, textBlockStyles } from "./textBlock.styles";
import { TextFitContext } from "./TextFit";

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
export type TextBlockOverflow = "wrap" | "truncate";
export type TextBlockWidth = "fill";

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
  /**
   * `"truncate"` keeps each line to one line that ends in an ellipsis and lets the block shrink in
   * a flex row. SnippetCardBlock sets it for the text in its slots; pass `"wrap"` there to wrap
   * anyway. Omitted elsewhere, the text wraps.
   */
  overflow?: TextBlockOverflow;
  /** `"fill"` makes the block as wide as its container. Omit it to size to the content. */
  width?: TextBlockWidth;
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
      align: ownAlign,
      secondaryMaxLines,
      secondaryTone,
      overflow: ownOverflow,
      width: ownWidth,
      className,
    },
    ref,
  ) => {
    // A card slot supplies the fit the caller leaves out.
    const slot = useContext(TextFitContext);
    const align = ownAlign ?? slot.align ?? "left";
    const overflow = ownOverflow ?? slot.overflow ?? "wrap";
    const width = ownWidth ?? slot.width;
    const styles = textBlockStyles;
    const secondaryClassName = clsx(
      styles.secondary,
      names.secondary,
      !(
        ["text", "number", "highlight-number"].includes(variant) ||
        (variant === "highlight-text" && size === "xs")
      ) && styles.secondaryTypography,
      secondaryTone && styles.secondaryTone[secondaryTone],
      secondaryTone && names.secondaryTone[secondaryTone],
    );
    const secondaryStyle =
      secondaryMaxLines !== undefined
        ? ({ "--_openui-text-block-secondary-max-lines": secondaryMaxLines } as React.CSSProperties)
        : undefined;

    return (
      <div
        ref={ref}
        className={clsx(
          styles.root,
          names.root,
          styles.variant[variant],
          names.variant[variant],
          styles.size[size],
          names.size[size],
          styles.align[align],
          names.align[align],
          styles.type[type],
          names.type[type],
          overflow && [styles.overflow[overflow], names.overflow[overflow]],
          width && [styles.width[width], names.width[width]],
          className,
        )}
      >
        <InlineMarkdownRenderer content={primary} className={clsx(styles.primary, names.primary)} />
        {secondary &&
          (secondaryStyle ? (
            // The line-clamp style needs its own block element — the markdown
            // renderer has no style passthrough.
            <div className={secondaryClassName} data-clamped="true" style={secondaryStyle}>
              <InlineMarkdownRenderer content={secondary} />
            </div>
          ) : (
            <InlineMarkdownRenderer content={secondary} className={secondaryClassName} />
          ))}
        {tertiary && (
          <InlineMarkdownRenderer
            content={tertiary}
            className={clsx(styles.tertiary, names.tertiary)}
          />
        )}
      </div>
    );
  },
);

TextBlockView.displayName = "TextBlockView";
