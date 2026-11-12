"use client";

import clsx from "clsx";
import type { CSSProperties } from "react";
import { names as pulseNames, skeletonPulseStyles } from "../SkeletonPulse/skeletonPulse.styles";
import { names, skeletonBarStyles } from "./skeleton.styles";
interface SkeletonBarProps {
  height: string;
  width: string;
  borderRadius?: string;
}

export function SkeletonBar({ height, width, borderRadius }: SkeletonBarProps) {
  const styles = skeletonBarStyles;
  const pulse = skeletonPulseStyles;
  return (
    <div
      className={clsx(styles.root, names.bar, pulse.root, pulseNames.root)}
      style={
        {
          "--_openui-skeleton-bar-height": height,
          "--_openui-skeleton-bar-width": width,
          ...(borderRadius ? { "--_openui-skeleton-bar-border-radius": borderRadius } : {}),
        } as CSSProperties
      }
    />
  );
}
