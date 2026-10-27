import clsx from "clsx";
import { type CSSProperties, forwardRef, type ReactNode } from "react";
import { InlineMarkdownRenderer } from "../InlineMarkdownRenderer";

export interface EntityListRow {
  /** A label string, or a composed node such as an EntityTitle or LeadingText. */
  left: string | ReactNode;
  /** A value string, or a node such as a Metric, Tag or Text. */
  right?: string | ReactNode;
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

const renderCell = (value: string | ReactNode) =>
  typeof value === "string" ? <InlineMarkdownRenderer content={value} /> : value;

function EntityListRowView({ row, rowType }: { row: EntityListRow; rowType: RowType }) {
  const rightVariant = row.rightVariant ?? "text";
  // A composed left side (EntityTitle, LeadingText) takes the free width and
  // centers with the value, instead of the 50/50 label/value split.
  const composed = typeof row.left !== "string";
  return (
    <div
      className={clsx("openui-entity-list__row", `openui-entity-list__row--${rowType}`, {
        "openui-entity-list__row--composed": composed,
      })}
    >
      <div
        className={clsx(
          "openui-entity-list__cell-left",
          `openui-entity-list__cell-left--${rowType}`,
        )}
      >
        {renderCell(row.left)}
      </div>
      {row.right != null && row.right !== "" && (
        <div
          className={clsx(
            "openui-entity-list__cell-right",
            `openui-entity-list__cell-right--${rightVariant}`,
            `openui-entity-list__cell-right--${rowType}`,
          )}
        >
          {renderCell(row.right)}
        </div>
      )}
    </div>
  );
}

/** A two-column key/value list with optional header and footer rows. */
export const EntityList = forwardRef<HTMLDivElement, EntityListProps>(
  ({ rows = [], size = "default", header, footer, className }, ref) => {
    const showHeaderFooter = size === "default";
    const rowCount =
      rows.length + (showHeaderFooter && header ? 1 : 0) + (showHeaderFooter && footer ? 1 : 0);

    return (
      <div
        ref={ref}
        className={clsx("openui-entity-list", `openui-entity-list--${size}`, className)}
        // Lets side-by-side lists in a Grid share row heights (see grid.scss).
        style={{ "--openui-entity-list-rows": rowCount } as CSSProperties}
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
