const numberTickFormatter = (value: number) => {
  if (typeof value === "number") {
    const absValue = Math.abs(value);

    if (absValue >= 1e12) {
      return (value / 1e12).toFixed(absValue >= 10e12 ? 0 : 1) + "T";
    } else if (absValue >= 1e9) {
      return (value / 1e9).toFixed(absValue >= 10e9 ? 0 : 1) + "B";
    } else if (absValue >= 1e6) {
      return (value / 1e6).toFixed(absValue >= 10e6 ? 0 : 1) + "M";
    } else if (absValue >= 1e3) {
      return (value / 1e3).toFixed(absValue >= 10e3 ? 0 : 1) + "K";
    } else {
      if (value % 1 !== 0) {
        return value.toFixed(2);
      }
      return value.toString();
    }
  }
  return String(value);
};

const DEFAULT_MIN_Y_AXIS_WIDTH = 20;
const DEFAULT_MAX_Y_AXIS_WIDTH = 200;
const DEFAULT_Y_AXIS_PADDING = 10;

const measureYAxisWidth = (
  ticks: number[],
  context: CanvasRenderingContext2D,
  options?: { minWidth?: number; maxWidth?: number; padding?: number },
): number => {
  const minWidth = options?.minWidth ?? DEFAULT_MIN_Y_AXIS_WIDTH;
  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_Y_AXIS_WIDTH;
  const padding = options?.padding ?? DEFAULT_Y_AXIS_PADDING;

  let maxTextWidth = 0;
  for (const tick of ticks) {
    const w = context.measureText(numberTickFormatter(tick)).width;
    if (w > maxTextWidth) maxTextWidth = w;
  }

  return Math.max(minWidth, Math.min(maxWidth, Math.ceil(maxTextWidth) + padding));
};

export { measureYAxisWidth, numberTickFormatter };
