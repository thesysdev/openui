import clsx from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import { IconButton } from "../../../IconButton";

interface ScrollButtonsVerticalProps {
  dataHeight: number;
  effectiveHeight: number;
  canScrollUp: boolean;
  canScrollDown: boolean;
  isSideBarTooltipOpen: boolean;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

export const ScrollButtonsVertical = React.memo(
  ({
    dataHeight,
    effectiveHeight,
    canScrollUp,
    canScrollDown,
    isSideBarTooltipOpen,
    onScrollUp,
    onScrollDown,
  }: ScrollButtonsVerticalProps) => {
    if (dataHeight <= effectiveHeight) {
      return null;
    }

    return (
      <div className="openui-chart-vertical-scroll-buttons-container">
        <IconButton
          className={clsx(
            "openui-chart-vertical-scroll-button openui-chart-vertical-scroll-button--up",
            {
              "openui-chart-vertical-scroll-button--disabled": !canScrollUp,
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
            "openui-chart-vertical-scroll-button openui-chart-vertical-scroll-button--down",
            {
              "openui-chart-vertical-scroll-button--disabled": !canScrollDown,
              "openui-chart-vertical-scroll-button--SideBarTooltip": isSideBarTooltipOpen,
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
