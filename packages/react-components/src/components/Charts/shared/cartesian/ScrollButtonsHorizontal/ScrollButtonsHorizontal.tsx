"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { IconButton } from "../../../../IconButton";
import { names, scrollButtonsHorizontalStyles } from "./scrollButtonsHorizontal.styles";

interface ScrollButtonsHorizontalProps {
  dataWidth: number;
  effectiveWidth: number;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

export const ScrollButtonsHorizontal = React.memo(
  ({
    dataWidth,
    effectiveWidth,
    canScrollLeft,
    canScrollRight,
    onScrollLeft,
    onScrollRight,
  }: ScrollButtonsHorizontalProps) => {
    const styles = scrollButtonsHorizontalStyles;
    if (dataWidth <= effectiveWidth) {
      return null;
    }

    return (
      <div className={clsx(styles.root, names.root)}>
        <IconButton
          className={clsx(styles.button, styles.left, names.button, names.left)}
          icon={<ChevronLeft className={names.icon} />}
          variant="secondary"
          aria-label="Scroll left"
          onClick={onScrollLeft}
          size="2-extra-small"
          disabled={!canScrollLeft}
        />

        <IconButton
          className={clsx(styles.button, styles.right, names.button, names.right)}
          icon={<ChevronRight className={names.icon} />}
          variant="secondary"
          size="2-extra-small"
          aria-label="Scroll right"
          onClick={onScrollRight}
          disabled={!canScrollRight}
        />
      </div>
    );
  },
);

ScrollButtonsHorizontal.displayName = "ScrollButtonsHorizontal";
