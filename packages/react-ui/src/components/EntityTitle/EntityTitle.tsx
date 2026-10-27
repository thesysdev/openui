import clsx from "clsx";
import { forwardRef, type ReactNode } from "react";

export type EntityTitleLayout = "horizontal" | "vertical";

export interface EntityTitleProps {
  /** The visual in front of the title: an Avatar, an icon badge or an emoji. */
  leading?: ReactNode;
  title: string;
  /** A line of context: a string, or composed content such as a Tag, Metric or Link. */
  subtitle?: ReactNode;
  layout?: EntityTitleLayout;
  className?: string;
}

/**
 * A leading visual with a title and an optional subtitle, for naming a person,
 * company, place or thing. The leading is sized to the text block beside it.
 */
export const EntityTitle = forwardRef<HTMLDivElement, EntityTitleProps>(
  ({ leading, title, subtitle, layout = "horizontal", className }, ref) => (
    <div
      ref={ref}
      className={clsx("openui-entity-title", `openui-entity-title--${layout}`, className)}
    >
      {leading && <span className="openui-entity-title__leading">{leading}</span>}
      <div className="openui-entity-title__text">
        <span className="openui-entity-title__title">{title}</span>
        {subtitle && (
          <span
            className={clsx("openui-entity-title__subtitle", {
              "openui-entity-title__subtitle--composed": typeof subtitle !== "string",
            })}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  ),
);

EntityTitle.displayName = "EntityTitle";
