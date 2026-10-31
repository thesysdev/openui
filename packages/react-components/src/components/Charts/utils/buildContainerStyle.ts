export function buildContainerStyle(
  chartStyle: Record<string, string | undefined>,
  fixedWidth?: number | string,
  height?: number | string,
): Record<string, string | number | undefined> {
  const s: Record<string, string | number | undefined> = { ...chartStyle };
  if (typeof fixedWidth === "string") s["width"] = fixedWidth;
  if (typeof height === "string") s["height"] = height;
  return s;
}
