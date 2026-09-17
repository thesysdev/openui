import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { CardBlockLayout, cardKeyDownHandler } from "../_shared/cards/CardBlockLayout";
import { toCssUrl } from "../_shared/utils";

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
  const { item, clickable = false, onClick, className } = props;
  const { tag, body, bgImageSrc, bgImageAlt } = item;
  const backgroundImage = toCssUrl(bgImageSrc);
  const cardImageStyle = backgroundImage
    ? ({ "--openui-visual-card-image": backgroundImage } as CSSProperties)
    : undefined;

  return (
    <div
      ref={ref}
      className={clsx(
        "openui-visual-first-card",
        clickable ? "openui-visual-first-card--clickable" : "openui-visual-first-card--static",
        className,
      )}
      style={cardImageStyle}
      aria-label={cardImageStyle ? bgImageAlt : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable && onClick ? cardKeyDownHandler(onClick) : undefined}
    >
      <div className="openui-visual-first-card__top">
        <div className="openui-visual-first-card__tag">{tag ?? null}</div>
        {clickable && (
          <div className="openui-visual-first-card__action" aria-hidden="true">
            <ChevronRight size={16} />
          </div>
        )}
      </div>
      {body ? <div className="openui-visual-first-card__bottom">{body}</div> : null}
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
      className={className}
      itemKey={(item, index) => item.id ?? `visual-card-${index}`}
      renderItem={(item, index) => (
        <VisualCard item={item} clickable={clickable} onClick={() => onItemClick?.(index)} />
      )}
    />
  );
});

VisualCardBlock.displayName = "VisualCardBlock";
