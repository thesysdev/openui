"use client";

import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { CardBlockLayout, cardKeyDownHandler } from "../_shared/cards/CardBlockLayout";
import { toCssUrl } from "../_shared/utils/safeUrl";
import { TagSurfaceContext } from "../Tag/TagSurface";
import { names, visualCardStyles } from "./card.styles";

export interface VisualCardBlockItem {
  id?: string;
  /** Rendered in the top-left slot (typically a Tag). */
  tag?: ReactNode;
  /** Rendered inside the bottom panel (typically bold text). */
  body?: ReactNode;
  bgImageSrc?: string;
  /** Alt text for the background image. */
  bgImageAlt?: string;
}

export interface VisualCardProps {
  item: VisualCardBlockItem;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

/** A photo-first card: background image with gradient, a tag on top and a body panel at the bottom. */
export const VisualCard = forwardRef<HTMLDivElement, VisualCardProps>((props, ref) => {
  const styles = visualCardStyles;
  const { item, clickable = false, onClick, className } = props;
  const { tag, body, bgImageSrc, bgImageAlt } = item;
  const backgroundImage = toCssUrl(bgImageSrc);
  const cardImageStyle = backgroundImage
    ? ({ "--_openui-visual-card-image": backgroundImage } as CSSProperties)
    : undefined;

  return (
    <div
      ref={ref}
      className={clsx(
        names.card,
        styles.card,
        clickable && [names.clickable.true, styles.clickable.true],
        className,
      )}
      style={cardImageStyle}
      aria-label={cardImageStyle ? bgImageAlt : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable && onClick ? cardKeyDownHandler(onClick) : undefined}
    >
      <div className={clsx(names.top, styles.top)}>
        <div className={clsx(names.tag, styles.tag)}>
          <TagSurfaceContext.Provider value="image">{tag ?? null}</TagSurfaceContext.Provider>
        </div>
        {clickable && (
          <div className={clsx(names.action, styles.action)} aria-hidden="true">
            <ChevronRight size={16} className={clsx(names.actionIcon, styles.actionIcon)} />
          </div>
        )}
      </div>
      {body ? <div className={clsx(names.bottom, styles.bottom)}>{body}</div> : null}
    </div>
  );
});

VisualCard.displayName = "VisualCard";

export interface VisualCardBlockProps {
  items: VisualCardBlockItem[];
  layout?: "grid" | "carousel";
  responsive?: boolean;
  /** Overrides the CSS gap variable (numbers are treated as px). */
  gap?: number | string;
  /** Makes every card focusable/clickable; `onItemClick` receives the item index. */
  clickable?: boolean;
  onItemClick?: (index: number) => void;
  className?: string;
}

/** A three-per-row grid or carousel of VisualCards. */
export const VisualCardBlock = forwardRef<HTMLDivElement, VisualCardBlockProps>((props, ref) => {
  const { items, layout, responsive, gap, clickable = false, onItemClick, className } = props;

  return (
    <CardBlockLayout
      ref={ref}
      size="medium"
      cardType="visual-first-card"
      data-card-type="VisualCard"
      items={items}
      layout={layout}
      responsive={responsive}
      maxPerRow={3}
      gap={gap}
      className={clsx(names.root, className)}
      itemKey={(item, index) => item.id ?? `visual-card-${index}`}
      renderItem={(item, index) => (
        <VisualCard item={item} clickable={clickable} onClick={() => onItemClick?.(index)} />
      )}
    />
  );
});

VisualCardBlock.displayName = "VisualCardBlock";
