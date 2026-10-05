import clsx from "clsx";
import { forwardRef } from "react";
import { InlineMarkdownRenderer } from "../InlineMarkdownRenderer";

export interface EntityListRow {
  left: string;
  right: string;
  rightVariant?: "text" | "number";
}

export type EntityListSize = "small" | "default";

export interface EntityListProps {
  rows?: EntityListRow[];
  size?: EntityListSize;
  /** Only rendered when `size` is "default". */
  header?: EntityListRow;
  /** Only rendered when `size` is "default". */
  footer?: EntityListRow;
  className?: string;
}

type RowType = "header" | "body" | "footer";

function EntityListRowView({ row, rowType }: { row: EntityListRow; rowType: RowType }) {
  const rightVariant = row.rightVariant ?? "text";
  return (
    <div className={clsx("openui-entity-list__row", `openui-entity-list__row--${rowType}`)}>
      <span
        className={clsx(
          "openui-entity-list__cell-left",
          `openui-entity-list__cell-left--${rowType}`,
        )}
      >
        <InlineMarkdownRenderer content={row.left} />
      </span>
      <span
        className={clsx(
          "openui-entity-list__cell-right",
          `openui-entity-list__cell-right--${rightVariant}`,
          `openui-entity-list__cell-right--${rowType}`,
        )}
      >
        <InlineMarkdownRenderer content={row.right} />
      </span>
    </div>
  );
}

/** A two-column key/value list with optional header and footer rows. */
export const EntityList = forwardRef<HTMLDivElement, EntityListProps>(
  ({ rows = [], size = "default", header, footer, className }, ref) => {
    const showHeaderFooter = size === "default";

    return (
      <div
        ref={ref}
        className={clsx("openui-entity-list", `openui-entity-list--${size}`, className)}
      >
        {showHeaderFooter && header && <EntityListRowView row={header} rowType="header" />}
        {rows.map((row, index) => (
          <EntityListRowView key={index} row={row} rowType="body" />
        ))}
        {showHeaderFooter && footer && <EntityListRowView row={footer} rowType="footer" />}
      </div>
    );
  },
);

EntityList.displayName = "EntityList";
