import clsx from "clsx";
import { forwardRef, type ReactNode } from "react";
import { CardBlockLayout, cardKeyDownHandler } from "../_shared/cards/CardBlockLayout";

export interface CompositeCardBlockItem {
  id?: string;
  header?: ReactNode;
  body?: ReactNode[];
  footer?: {
    price?: ReactNode;
    button?: ReactNode;
  };
}

export interface CompositeCardProps {
  item: CompositeCardBlockItem;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

/** A bordered card with header, stacked body content and a price/button footer. */
export const CompositeCard = forwardRef<HTMLDivElement, CompositeCardProps>((props, ref) => {
  const { item, clickable = false, onClick, className } = props;
  const { header, body, footer } = item;
  const bodyItems = body ?? [];
  const hasFooter = Boolean(footer?.price || footer?.button);

  return (
    <div className="openui-composite-card__wrapper">
      <div
        ref={ref}
        className={clsx(
          "openui-composite-card",
          clickable ? "openui-composite-card--clickable" : "openui-composite-card--static",
          className,
        )}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? onClick : undefined}
        onKeyDown={clickable && onClick ? cardKeyDownHandler(onClick) : undefined}
      >
        {header && <div className="openui-composite-card__header">{header}</div>}

        {bodyItems.length > 0 && <div className="openui-composite-card__body">{bodyItems}</div>}

        {hasFooter && (
          <div className="openui-composite-card__footer">
            <div className="openui-composite-card__footer-content">
              {footer?.price ?? null}
              {footer?.button ?? null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

CompositeCard.displayName = "CompositeCard";

export interface CompositeCardBlockProps {
  items: CompositeCardBlockItem[];
  layout?: "grid" | "carousel";
  responsive?: boolean;
  /** Overrides the CSS gap variable (numbers are treated as px). */
  gap?: number | string;
  /** Makes every card focusable/clickable; `onItemClick` receives the item index. */
  clickable?: boolean;
  onItemClick?: (index: number) => void;
  className?: string;
}

/** A two-per-row grid or carousel of CompositeCards. */
export const CompositeCardBlock = forwardRef<HTMLDivElement, CompositeCardBlockProps>(
  (props, ref) => {
    const { items, layout, responsive, gap, clickable = false, onItemClick, className } = props;

    return (
      <CardBlockLayout
        ref={ref}
        size="medium"
        cardType="composite-card"
        data-card-type="CompositeCard"
        items={items}
        layout={layout}
        responsive={responsive}
        maxPerRow={2}
        gap={gap}
        className={className}
        itemKey={(item, index) => {
          const itemId = item.id?.trim();
          return itemId ? `composite-card-${itemId}-${index}` : `composite-card-${index}`;
        }}
        renderItem={(item, index) => (
          <CompositeCard item={item} clickable={clickable} onClick={() => onItemClick?.(index)} />
        )}
      />
    );
  },
);

CompositeCardBlock.displayName = "CompositeCardBlock";
