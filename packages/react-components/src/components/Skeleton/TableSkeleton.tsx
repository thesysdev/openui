"use client";

import clsx from "clsx";
import type { CSSProperties } from "react";
import { SkeletonBar } from "./SkeletonBar";
import { names, tableSkeletonStyles } from "./tableSkeleton.styles";
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  const styles = tableSkeletonStyles;
  return (
    <div className={clsx(styles.root, names.root)}>
      <div
        className={clsx(styles.row, names.row)}
        style={{ "--_openui-table-skeleton-columns": columns } as CSSProperties}
      >
        {Array.from({ length: columns }, (_, i) => (
          <div
            key={`h-${i}`}
            className={clsx(styles.cell, styles.headerCell, names.cell, names.headerCell)}
          >
            <SkeletonBar height="14px" width="100%" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }, (_, ri) => (
        <div
          key={`r-${ri}`}
          className={clsx(styles.row, names.row)}
          style={{ "--_openui-table-skeleton-columns": columns } as CSSProperties}
        >
          {Array.from({ length: columns }, (_, ci) => (
            <div key={`c-${ri}-${ci}`} className={clsx(styles.cell, names.cell)}>
              <SkeletonBar height="14px" width={`${50 + ((ri * 7 + ci * 13) % 40)}%`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
