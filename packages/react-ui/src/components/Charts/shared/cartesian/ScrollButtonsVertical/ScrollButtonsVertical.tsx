import clsx from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import { IconButton } from "../../../../IconButton";
import { CHART_CLASS_PREFIX } from "../../../utils/constants";

interface ScrollButtonsVerticalProps {
  canScrollUp: boolean;
  canScrollDown: boolean;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

export const ScrollButtonsVertical = React.memo(
  ({ canScrollUp, canScrollDown, onScrollUp, onScrollDown }: ScrollButtonsVerticalProps) => {
    if (!canScrollUp && !canScrollDown) {
      return null;
    }

    return (
      <div className={`${CHART_CLASS_PREFIX}-chart-vertical-scroll-buttons-container`}>
        <IconButton
          className={clsx(
            `${CHART_CLASS_PREFIX}-chart-vertical-scroll-button ${CHART_CLASS_PREFIX}-chart-vertical-scroll-button--up`,
            {
              [`${CHART_CLASS_PREFIX}-chart-vertical-scroll-button--disabled`]: !canScrollUp,
            },
          )}
          icon={<ChevronUp />}
          variant="secondary"
          onClick={onScrollUp}
          size="extra-small"
          disabled={!canScrollUp}
          aria-label="Scroll up"
        />

        <IconButton
          className={clsx(
            `${CHART_CLASS_PREFIX}-chart-vertical-scroll-button ${CHART_CLASS_PREFIX}-chart-vertical-scroll-button--down`,
            {
              [`${CHART_CLASS_PREFIX}-chart-vertical-scroll-button--disabled`]: !canScrollDown,
            },
          )}
          icon={<ChevronDown />}
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
