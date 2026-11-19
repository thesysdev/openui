"use client";

import clsx from "clsx";
import { forwardRef } from "react";
import { InlineMarkdownRenderer } from "../InlineMarkdownRenderer";
import { entityListStyles, names } from "./entityList.styles";

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
  const styles = entityListStyles;
  const rightVariant = row.rightVariant ?? "text";
  return (
    <div className={clsx(styles.row, names.row, styles.rowType[rowType], names.rowType[rowType])}>
      <span className={clsx(styles.cellLeft, names.cellLeft)}>
        <InlineMarkdownRenderer content={row.left} />
      </span>
      <span
        className={clsx(
          styles.cellRight,
          names.cellRight,
          styles.rightVariant[rightVariant],
          names.rightVariant[rightVariant],
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
    const styles = entityListStyles;
    const showHeaderFooter = size === "default";

    return (
      <div
        ref={ref}
        className={clsx(styles.root, names.root, styles.size[size], names.size[size], className)}
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
