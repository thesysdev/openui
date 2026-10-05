import { describe, expect, it } from "vitest";
import { heatmapCellValue } from "./useHeatmapChartOrchestrator";

describe('heatmapCellValue (the single source of "is this cell empty")', () => {
  it("passes finite numbers through, including 0 and negatives", () => {
    expect(heatmapCellValue(42)).toBe(42);
    expect(heatmapCellValue(0)).toBe(0);
    expect(heatmapCellValue(-5)).toBe(-5);
    expect(heatmapCellValue("42")).toBe(42);
    expect(heatmapCellValue("3.5")).toBe(3.5);
  });

  it('treats empty/whitespace strings as missing (Number("") is 0 — the trap)', () => {
    expect(heatmapCellValue("")).toBeNull();
    expect(heatmapCellValue("   ")).toBeNull();
  });

  it("treats absent keys and non-numeric strings as missing", () => {
    expect(heatmapCellValue(undefined)).toBeNull();
    expect(heatmapCellValue("abc")).toBeNull();
    expect(heatmapCellValue("NaN")).toBeNull();
    expect(heatmapCellValue("Infinity")).toBeNull();
  });
});
