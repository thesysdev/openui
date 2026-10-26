import clsx from "clsx";

/**
 * A chart's empty state, under its own class prefix (`kit-trend-chart--empty`
 * and so on), so each chart keeps its own empty styling.
 */
export function ChartEmpty({
  prefix,
  className,
  text = "No data available",
}: {
  prefix: string;
  className?: string;
  text?: string;
}) {
  return (
    <div className={clsx(`${prefix} ${prefix}--empty`, className)}>
      <span className={`${prefix}-empty-text`}>{text}</span>
    </div>
  );
}
