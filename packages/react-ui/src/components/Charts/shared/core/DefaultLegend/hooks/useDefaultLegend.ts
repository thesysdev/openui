import { useMemo } from "react";
import { useCanvasContextForLabelSize } from "../../../../hooks";
import { LegendItem } from "../../../../types";

const CHARACTER_WIDTH = 7;
const INDICATOR_WIDTH = 10;
const GAP_WIDTH = 12;

interface UseDefaultLegendProps {
  items: LegendItem[];
  containerWidth?: number;
  buttonWidth?: number;
  isExpanded: boolean;
}

interface UseDefaultLegendResult {
  displayItems: LegendItem[];
  hasMoreItems: boolean;
  toggleButtonText: string;
}

export const useDefaultLegend = ({
  items,
  containerWidth,
  buttonWidth,
  isExpanded,
}: UseDefaultLegendProps): UseDefaultLegendResult => {
  const canvasContext = useCanvasContextForLabelSize();

  const calculateItemWidth = useMemo(
    () =>
      (item: LegendItem): number => {
        let displayText = item.label;
        if (item.percentage !== undefined) {
          displayText += ` (${item.percentage.toFixed(1)}%)`;
        }
        if (canvasContext) {
          return canvasContext.measureText(displayText).width + INDICATOR_WIDTH + GAP_WIDTH;
        }
        return displayText.length * CHARACTER_WIDTH + INDICATOR_WIDTH + GAP_WIDTH;
      },
    [canvasContext],
  );

  const { visibleItems, hasMoreItems } = useMemo(() => {
    if (!containerWidth || items.length === 0) {
      return { visibleItems: items, hasMoreItems: false };
    }

    const availableWidth = containerWidth - (buttonWidth ?? 0);
    let currentWidth = 0;
    let visibleCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      const itemWidth = calculateItemWidth(item);
      const requiredWidth = visibleCount > 0 ? itemWidth + GAP_WIDTH : itemWidth;
      if (currentWidth + requiredWidth <= availableWidth) {
        currentWidth += requiredWidth;
        visibleCount++;
      } else {
        break;
      }
    }

    if (visibleCount === items.length) {
      return { visibleItems: items, hasMoreItems: false };
    }

    if (visibleCount === 0 && items[0]) {
      return {
        visibleItems: [items[0]],
        hasMoreItems: items.length > 1,
      };
    }

    return {
      visibleItems: items.slice(0, visibleCount),
      hasMoreItems: items.length > visibleCount,
    };
  }, [items, containerWidth, buttonWidth, calculateItemWidth]);

  const displayItems = useMemo(
    () => (isExpanded ? items : visibleItems),
    [isExpanded, items, visibleItems],
  );

  const toggleButtonText = useMemo(() => {
    if (isExpanded) {
      return "Show Less";
    }
    const hiddenCount = items.length - visibleItems.length;
    return `${hiddenCount} more`;
  }, [isExpanded, items.length, visibleItems.length]);

  return {
    displayItems,
    hasMoreItems,
    toggleButtonText,
  };
};
