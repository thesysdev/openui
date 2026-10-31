"use client";

import clsx from "clsx";
import { names, skeletonStyles } from "./skeleton.styles";
import { SkeletonBar } from "./SkeletonBar";
export function Skeleton({
  count = 1,
  height = "16px",
  width = "100%",
  borderRadius,
  className,
}: {
  count?: number;
  height?: string;
  width?: string;
  borderRadius?: string;
  className?: string;
}) {
  const styles = skeletonStyles;
  return (
    <div className={clsx(styles.root, names.root, className)}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonBar key={i} height={height} width={width} borderRadius={borderRadius} />
      ))}
    </div>
  );
}
