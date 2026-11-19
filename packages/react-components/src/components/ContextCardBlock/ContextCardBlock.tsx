"use client";

import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { InlineMarkdownRenderer } from "../InlineMarkdownRenderer";
import { TagSurfaceContext } from "../Tag/TagSurface";
import { CardBlockLayout, cardKeyDownHandler } from "../_shared/cards/CardBlockLayout";
import { toCssUrl } from "../_shared/utils/safeUrl";
import { contextCardStyles, names } from "./card.styles";

export type ContextCardBgColor = "gray" | "info" | "success" | "warning" | "danger";

export interface ContextCardBlockItem {
  id?: string;
  /** Plain string renders as small title text; any other node (e.g. a Tag) renders in the tag slot. */
  title?: ReactNode;
  /** Inline markdown supported. */
  body?: string;
  bgColor?: ContextCardBgColor;
  bgImageSrc?: string;
  /** Alt text for the background image. */
  bgImageAlt?: string;
}

export interface ContextCardProps {
  item: ContextCardBlockItem;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

/** A compact tinted card with a title (text or tag) and a bold markdown body. */
export const ContextCard = forwardRef<HTMLDivElement, ContextCardProps>((props, ref) => {
  const styles = contextCardStyles;
  const { item, clickable = false, onClick, className } = props;
  const { title, body, bgColor, bgImageSrc, bgImageAlt } = item;
  const backgroundImage = toCssUrl(bgImageSrc);
  const backgroundColor = bgColor ?? "default";

  const titleContent =
    title == null || title === "" ? null : typeof title === "string" ? (
      <span className={clsx(names.title, styles.title)}>{title}</span>
    ) : (
      <div className={clsx(names.tagWrapper, styles.tagWrapper)}>
        <div className={clsx(names.tag, styles.tag)}>{title}</div>
      </div>
    );

  return (
    <div
      ref={ref}
      className={clsx(
        names.card,
        styles.card,
        names.bgColor[backgroundColor],
        styles.bgColor[backgroundColor],
        clickable && [names.clickable.true, styles.clickable.true],
        className,
      )}
      data-background-image={Boolean(backgroundImage) || undefined}
      style={
        backgroundImage
          ? ({ "--_openui-context-card-image": backgroundImage } as CSSProperties)
          : undefined
      }
      aria-label={backgroundImage ? bgImageAlt : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable && onClick ? cardKeyDownHandler(onClick) : undefined}
    >
      {/* Tags over the background image take the overlay surface. */}
      <TagSurfaceContext.Provider value={backgroundImage ? "image" : undefined}>
        <div className={clsx(names.vertical, styles.vertical)}>
          <div className={clsx(names.top, styles.top)}>
            {titleContent}
            {clickable && (
              <div className={clsx(names.chevron, styles.chevron)} aria-hidden="true">
                <ChevronRight size={16} className={clsx(names.chevronIcon, styles.chevronIcon)} />
              </div>
            )}
          </div>
          {body && (
            <div className={clsx(names.bottom, styles.bottom)}>
              <div className={clsx(names.body, styles.body)}>
                <InlineMarkdownRenderer content={body} />
              </div>
            </div>
          )}
        </div>
      </TagSurfaceContext.Provider>
    </div>
  );
});

ContextCard.displayName = "ContextCard";

export interface ContextCardBlockProps {
  items: ContextCardBlockItem[];
  layout?: "grid" | "carousel";
  responsive?: boolean;
  /** Overrides the CSS gap variable (numbers are treated as px). */
  gap?: number | string;
  /** Makes every card focusable/clickable; `onItemClick` receives the item index. */
  clickable?: boolean;
  onItemClick?: (index: number) => void;
  className?: string;
}

/** A grid or carousel of ContextCards (uses the small card block layout). */
export const ContextCardBlock = forwardRef<HTMLDivElement, ContextCardBlockProps>((props, ref) => {
  const { items, layout, responsive, gap, clickable = false, onItemClick, className } = props;

  return (
    <CardBlockLayout
      ref={ref}
      size="small"
      cardType="context-card"
      data-card-type="ContextCard"
      items={items}
      layout={layout}
      responsive={responsive}
      maxPerRow={3}
      gap={gap}
      className={clsx(names.root, className)}
      itemKey={(item, index) => item.id ?? `context-card-${index}`}
      renderItem={(item, index) => (
        <ContextCard item={item} clickable={clickable} onClick={() => onItemClick?.(index)} />
      )}
    />
  );
});

ContextCardBlock.displayName = "ContextCardBlock";
