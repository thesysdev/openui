import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "../IconButton";

type TableAlignment = "left" | "center" | "right";

const alignmentClasses: Record<TableAlignment, string> = {
  left: "openui-table-align-left",
  center: "openui-table-align-center",
  right: "openui-table-align-right",
};

// ─── Primitives ───

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & {
    containerRef?: React.RefObject<HTMLDivElement>;
    containerClassName?: string;
    containerStyle?: React.CSSProperties;
  }
>(({ className, containerRef, containerClassName, containerStyle, ...props }, ref) => (
  <div
    ref={containerRef}
    className={clsx("openui-table-container", containerClassName)}
    style={containerStyle}
  >
    <table ref={ref} className={clsx("openui-table", className)} {...props} />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={clsx("openui-table-header", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={clsx("openui-table-body", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={clsx("openui-table-footer", className)} {...props} />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={clsx("openui-table-row", className)} {...props} />
  ),
);
TableRow.displayName = "TableRow";

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  icon?: React.ReactNode;
  align?: TableAlignment;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, icon, align, ...props }, ref) => (
    <th ref={ref} className={clsx("openui-table-head", className)} {...props}>
      <div className={clsx("openui-table-head-content", align && alignmentClasses[align])}>
        {icon && <div className="openui-table-head-icon">{icon}</div>}
        <div className="openui-table-head-label">{children}</div>
      </div>
    </th>
  ),
);
TableHead.displayName = "TableHead";

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: TableAlignment;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align, ...props }, ref) => (
    <td
      ref={ref}
      className={clsx("openui-table-cell", align && alignmentClasses[align], className)}
      {...props}
    />
  ),
);
TableCell.displayName = "TableCell";

// ─── ScrollableTable ───

export interface ScrollableTableProps extends React.HTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}

const ScrollableTable = React.forwardRef<HTMLTableElement, ScrollableTableProps>(
  ({ className, containerClassName, containerStyle, children, ...tableProps }, ref) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [isScrollable, setIsScrollable] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const columnLeftsRef = useRef<number[]>([]);

    useEffect(() => {
      const container = scrollContainerRef.current;
      const wrapper = wrapperRef.current;
      if (!container || !wrapper) return;

      const compute = () => {
        const scrollable = container.scrollWidth > container.clientWidth;
        setIsScrollable(scrollable);
        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);

        const ths = wrapper.querySelectorAll<HTMLTableCellElement>("thead th");
        if (!ths || ths.length === 0) {
          columnLeftsRef.current = [];
          return;
        }
        const containerRect = container.getBoundingClientRect();
        const lefts: number[] = [];
        ths.forEach((th) => {
          const rect = th.getBoundingClientRect();
          const left = rect.left - containerRect.left + container.scrollLeft;
          lefts.push(Math.max(0, Math.round(left)));
        });
        columnLeftsRef.current = Array.from(new Set(lefts)).sort((a, b) => a - b);
      };

      compute();

      // Streamed rows and columns grow the table without resizing its
      // container, so observe the table as well. Re-measuring from an effect
      // keyed on `children` ran on every render and set state inside each
      // passive-effect flush; a burst of streamed chunks turned that into
      // "Maximum update depth exceeded".
      const ro = new ResizeObserver(() => compute());
      ro.observe(container);
      const table = container.querySelector("table");
      if (table) ro.observe(table);

      const onScroll = () => {
        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
      };
      container.addEventListener("scroll", onScroll);

      return () => {
        ro.disconnect();
        container.removeEventListener("scroll", onScroll);
      };
    }, []);

    const scrollToNextColumn = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container || columnLeftsRef.current.length === 0) return;
      const current = container.scrollLeft;
      const target = columnLeftsRef.current.find((l) => l > current + 1);
      const maxScroll = container.scrollWidth - container.clientWidth;
      const next = typeof target === "number" ? target : maxScroll;
      container.scrollTo({ left: Math.min(next, maxScroll), behavior: "smooth" });
    }, []);

    const scrollToPrevColumn = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container || columnLeftsRef.current.length === 0) return;
      const current = container.scrollLeft;
      const prevs = columnLeftsRef.current.filter((l) => l < current - 1);
      const prev = prevs.at(-1) ?? 0;
      container.scrollTo({ left: Math.max(0, prev), behavior: "smooth" });
    }, []);

    return (
      <div className="openui-scrollable-table-wrapper" ref={wrapperRef} tabIndex={0}>
        {isScrollable && (
          <>
            <div
              className={clsx(
                "openui-scrollable-table-control",
                "openui-scrollable-table-control-left",
                !canScrollLeft && "openui-scrollable-table-control-disabled",
              )}
            >
              <IconButton
                aria-label="Scroll left"
                size="small"
                variant="secondary"
                onClick={scrollToPrevColumn}
                disabled={!canScrollLeft}
                icon={<ChevronLeft size={16} />}
              />
            </div>
            <div
              className={clsx(
                "openui-scrollable-table-control",
                "openui-scrollable-table-control-right",
                !canScrollRight && "openui-scrollable-table-control-disabled",
              )}
            >
              <IconButton
                aria-label="Scroll right"
                size="small"
                variant="secondary"
                onClick={scrollToNextColumn}
                disabled={!canScrollRight}
                icon={<ChevronRight size={16} />}
              />
            </div>
          </>
        )}
        <Table
          ref={ref}
          containerRef={scrollContainerRef as React.RefObject<HTMLDivElement>}
          containerClassName={clsx("openui-scrollable-table-scroll-container", containerClassName)}
          containerStyle={containerStyle}
          className={className}
          style={{ width: isScrollable ? "max-content" : "100%" }}
          {...tableProps}
        >
          {children}
        </Table>
      </div>
    );
  },
);
ScrollableTable.displayName = "ScrollableTable";

export {
  ScrollableTable,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
