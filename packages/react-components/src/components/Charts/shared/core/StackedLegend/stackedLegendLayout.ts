export type StackedLegendLayout = "auto" | "showMore" | "scrollable";

export const LEGEND_ITEM_LIMIT = 6;
export const SHOW_MORE_BREAKPOINT = 450;

export const resolveStackedLegendLayout = (
  layout: StackedLegendLayout,
  containerWidth: number | undefined,
  itemCount: number,
): { isShowMore: boolean; isScrollable: boolean } => {
  const isShowMore =
    layout === "showMore" ||
    (layout === "auto" &&
      containerWidth !== undefined &&
      (containerWidth < SHOW_MORE_BREAKPOINT || itemCount > LEGEND_ITEM_LIMIT));
  const isScrollable = layout === "scrollable" || (layout === "auto" && !isShowMore);
  return { isShowMore, isScrollable };
};

export const formatStackedValue = (
  value: number,
  total: number,
  format: "percentage" | "number",
): string => {
  if (format === "number") return `${value}`;
  const pct = total > 0 ? (value / total) * 100 : 0;
  return `${pct.toFixed(1)}%`;
};
