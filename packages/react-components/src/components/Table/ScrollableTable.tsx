"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "../IconButton";
import { names, scrollableTableStyles } from "./scrollableTable.styles";
import { Table } from "./Table";

export interface ScrollableTableProps extends React.HTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}

const ScrollableTable = React.forwardRef<HTMLTableElement, ScrollableTableProps>(
  ({ className, containerClassName, containerStyle, children, ...tableProps }, ref) => {
    const styles = scrollableTableStyles;
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

      const ro = new ResizeObserver(() => compute());
      ro.observe(container);

      const onScroll = () => {
        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
      };
      container.addEventListener("scroll", onScroll);

      return () => {
        ro.disconnect();
        container.removeEventListener("scroll", onScroll);
      };
    }, [children]);

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
      <div className={clsx(styles.wrapper, names.wrapper)} ref={wrapperRef} tabIndex={0}>
        {isScrollable && (
          <>
            <div
              className={clsx(styles.control, names.control)}
              data-side="left"
              data-disabled={!canScrollLeft}
            >
              <IconButton
                aria-label="Scroll left"
                size="small"
                variant="secondary"
                onClick={scrollToPrevColumn}
                disabled={!canScrollLeft}
                icon={<ChevronLeft className={names.icon} size={16} />}
              />
            </div>
            <div
              className={clsx(styles.control, names.control)}
              data-side="right"
              data-disabled={!canScrollRight}
            >
              <IconButton
                aria-label="Scroll right"
                size="small"
                variant="secondary"
                onClick={scrollToNextColumn}
                disabled={!canScrollRight}
                icon={<ChevronRight className={names.icon} size={16} />}
              />
            </div>
          </>
        )}
        <Table
          ref={ref}
          containerRef={scrollContainerRef as React.RefObject<HTMLDivElement>}
          containerClassName={clsx(
            styles.scrollContainer,
            names.scrollContainer,
            containerClassName,
          )}
          containerStyle={containerStyle}
          className={clsx(styles.root, names.root, className)}
          data-scrollable={isScrollable || undefined}
          {...tableProps}
        >
          {children}
        </Table>
      </div>
    );
  },
);
ScrollableTable.displayName = "ScrollableTable";

export { ScrollableTable };
