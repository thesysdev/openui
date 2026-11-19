"use client";

import clsx from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import { IconButton } from "../../../../IconButton";
import { names, scrollButtonsVerticalStyles } from "./scrollButtonsVertical.styles";

interface ScrollButtonsVerticalProps {
  canScrollUp: boolean;
  canScrollDown: boolean;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

export const ScrollButtonsVertical = React.memo(
  ({ canScrollUp, canScrollDown, onScrollUp, onScrollDown }: ScrollButtonsVerticalProps) => {
    const styles = scrollButtonsVerticalStyles;
    if (!canScrollUp && !canScrollDown) {
      return null;
    }

    return (
      <div className={clsx(styles.root, names.root)}>
        <IconButton
          className={clsx(styles.button, names.button, names.up)}
          icon={<ChevronUp className={names.icon} />}
          variant="secondary"
          onClick={onScrollUp}
          size="extra-small"
          disabled={!canScrollUp}
          aria-label="Scroll up"
        />

        <IconButton
          className={clsx(styles.button, names.button, names.down)}
          icon={<ChevronDown className={names.icon} />}
          variant="secondary"
          size="extra-small"
          onClick={onScrollDown}
          disabled={!canScrollDown}
          aria-label="Scroll down"
        />
      </div>
    );
  },
);

ScrollButtonsVertical.displayName = "ScrollButtonsVertical";
