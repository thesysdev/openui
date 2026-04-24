import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { IconButton } from "../../../IconButton";

interface ScrollButtonsHorizontalProps {
  dataWidth: number;
  effectiveWidth: number;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  isSideBarTooltipOpen: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

export const ScrollButtonsHorizontal = React.memo(
  ({
    dataWidth,
    effectiveWidth,
    canScrollLeft,
    canScrollRight,
    isSideBarTooltipOpen,
    onScrollLeft,
    onScrollRight,
  }: ScrollButtonsHorizontalProps) => {
    if (dataWidth <= effectiveWidth) {
      return null;
    }

    return (
      <div className="openui-chart-horizontal-scroll-buttons-container">
        <IconButton
          className={clsx(
            "openui-chart-horizontal-scroll-button openui-chart-horizontal-scroll-button--left",
            {
              "openui-chart-horizontal-scroll-button--disabled": !canScrollLeft,
            },
          )}
          icon={<ChevronLeft />}
          variant="secondary"
          onClick={onScrollLeft}
          size="2-extra-small"
          disabled={!canScrollLeft}
          aria-label="Scroll left"
        />

        <IconButton
          className={clsx(
            "openui-chart-horizontal-scroll-button openui-chart-horizontal-scroll-button--right",
            {
              "openui-chart-horizontal-scroll-button--disabled": !canScrollRight,
              "openui-chart-horizontal-scroll-button--SideBarTooltip": isSideBarTooltipOpen,
            },
          )}
          icon={<ChevronRight />}
          variant="secondary"
          size="2-extra-small"
          onClick={onScrollRight}
          disabled={!canScrollRight}
          aria-label="Scroll right"
        />
      </div>
    );
  },
);

ScrollButtonsHorizontal.displayName = "ScrollButtonsHorizontal";
