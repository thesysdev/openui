import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { InlineMarkdownRenderer } from "../InlineMarkdownRenderer";
import { CardBlockLayout, cardKeyDownHandler } from "../_shared/cards/CardBlockLayout";
import { toCssUrl } from "../_shared/utils";

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
  const { item, clickable = false, onClick, className } = props;
  const { title, body, bgColor, bgImageSrc, bgImageAlt } = item;
  const backgroundImage = toCssUrl(bgImageSrc);
  const variant = backgroundImage ? "image" : bgColor;

  const titleContent =
    title == null || title === "" ? null : typeof title === "string" ? (
      <span className="openui-context-card__title-text">{title}</span>
    ) : (
      <div className="openui-context-card__tag-wrapper">
        <div className="openui-context-card__tag">{title}</div>
      </div>
    );

  return (
    <div
      ref={ref}
      className={clsx(
        "openui-context-card",
        clickable ? "openui-context-card--clickable" : "openui-context-card--static",
        variant && `openui-context-card--variant-${variant}`,
        className,
      )}
      style={backgroundImage ? { backgroundImage } : undefined}
      aria-label={backgroundImage ? bgImageAlt : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable && onClick ? cardKeyDownHandler(onClick) : undefined}
    >
      <div className="openui-context-card__vertical">
        <div className="openui-context-card__slot openui-context-card__slot--top">
          {titleContent}
          {clickable && (
            <div className="openui-context-card__chevron" aria-hidden="true">
              <ChevronRight size={16} />
            </div>
          )}
        </div>
        {body && (
          <div className="openui-context-card__slot openui-context-card__slot--bottom">
            <div className="openui-context-card__body-text">
              <InlineMarkdownRenderer content={body} />
            </div>
          </div>
        )}
      </div>
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
      className={className}
      itemKey={(item, index) => item.id ?? `context-card-${index}`}
      renderItem={(item, index) => (
        <ContextCard item={item} clickable={clickable} onClick={() => onItemClick?.(index)} />
      )}
    />
  );
});

ContextCardBlock.displayName = "ContextCardBlock";
