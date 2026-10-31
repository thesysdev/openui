"use client";

import clsx from "clsx";
import React from "react";
import { names, tableStyles } from "./table.styles";
import { names as cellNames, tableCellStyles } from "./tableCell.styles";
import { names as headNames, tableHeadStyles } from "./tableHead.styles";

type TableAlignment = "left" | "center" | "right";

// ─── Primitives ───

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & {
    containerRef?: React.RefObject<HTMLDivElement>;
    containerClassName?: string;
    containerStyle?: React.CSSProperties;
  }
>(({ className, containerRef, containerClassName, containerStyle, ...props }, ref) => {
  const styles = tableStyles;
  return (
    <div
      ref={containerRef}
      className={clsx(styles.container, names.container, containerClassName)}
      style={containerStyle}
    >
      <table ref={ref} className={clsx(styles.root, names.root, className)} {...props} />
    </div>
  );
});
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  return <thead ref={ref} className={clsx(names.header, className)} {...props} />;
});
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  return <tbody ref={ref} className={clsx(names.body, className)} {...props} />;
});
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const styles = tableStyles;
  return <tfoot ref={ref} className={clsx(styles.footer, names.footer, className)} {...props} />;
});
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => {
    const styles = tableStyles;
    return <tr ref={ref} className={clsx(styles.row, names.row, className)} {...props} />;
  },
);
TableRow.displayName = "TableRow";

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  icon?: React.ReactNode;
  align?: TableAlignment;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, icon, align, ...props }, ref) => {
    const styles = tableHeadStyles;
    return (
      <th
        ref={ref}
        className={clsx(
          styles.root,
          headNames.root,
          align && styles.align[align],
          headNames.align[align ?? "left"],
          className,
        )}
        {...props}
      >
        <div className={clsx(styles.content, headNames.content)}>
          {icon && <div className={clsx(styles.icon, headNames.icon)}>{icon}</div>}
          <div className={clsx(styles.label, headNames.label)}>{children}</div>
        </div>
      </th>
    );
  },
);
TableHead.displayName = "TableHead";

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: TableAlignment;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align, ...props }, ref) => {
    const styles = tableCellStyles;
    return (
      <td
        ref={ref}
        className={clsx(
          styles.root,
          cellNames.root,
          styles.align[align ?? "left"],
          cellNames.align[align ?? "left"],
          className,
        )}
        {...props}
      />
    );
  },
);
TableCell.displayName = "TableCell";

export { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow };
