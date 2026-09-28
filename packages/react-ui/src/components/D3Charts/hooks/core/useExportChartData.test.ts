import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { buildExportChartData } from "./useExportChartData";

// Unit tests for the PURE builder only (node env, no DOM). The gated hook
// (`useExportChartData`) needs a react-ui <PrintContextProvider> to return a
// string and is exercised at runtime, not here — see the report's behavior
// guard for how the "undefined outside the provider" contract is verified.

const twoSeriesData = [
  { month: "Jan", sales: 10, profit: 4 },
  { month: "Feb", sales: 20, profit: 8 },
  { month: "Mar", sales: 15, profit: 6 },
];

describe("buildExportChartData — 2D (cartesian) shape", () => {
  it("emits one series per dataKey with per-row labels and numeric values", () => {
    const result = buildExportChartData({
      type: "bar",
      data: twoSeriesData,
      categoryKey: "month",
      dataKeys: ["sales", "profit"],
      colors: ["#111", "#222"],
      legend: true,
    });

    expect(result.type).toBe("bar");
    expect(result.data).toEqual([
      {
        name: "sales",
        labels: ["Jan", "Feb", "Mar"],
        values: [10, 20, 15],
      },
      {
        name: "profit",
        labels: ["Jan", "Feb", "Mar"],
        values: [4, 8, 6],
      },
    ]);
  });

  it("coerces label values to strings and cell values to numbers", () => {
    const result = buildExportChartData({
      type: "line",
      data: [
        { year: 2024, value: "100" },
        { year: 2025, value: "200" },
      ],
      categoryKey: "year",
      dataKeys: ["value"],
      colors: ["#abc"],
    });

    // Category 2024 (a number) becomes the string "2024"; the string "100"
    // becomes the number 100 — mirroring react-ui's String()/Number() coercion.
    expect(result.data[0]?.labels).toEqual(["2024", "2025"]);
    expect(result.data[0]?.values).toEqual([100, 200]);
  });

  it("emits empty-string labels when no categoryKey is supplied", () => {
    const result = buildExportChartData({
      type: "bar",
      data: twoSeriesData,
      dataKeys: ["sales"],
      colors: ["#111"],
    });

    expect(result.data[0]?.labels).toEqual(["", "", ""]);
    expect(result.data[0]?.values).toEqual([10, 20, 15]);
  });

  it("emits an empty data array when dataKeys is omitted", () => {
    const result = buildExportChartData({
      type: "area",
      data: twoSeriesData,
      categoryKey: "month",
      colors: [],
    });

    expect(result.data).toEqual([]);
  });
});

describe("buildExportChartData — 1D (pie/radial) shape", () => {
  it("emits a single series keyed by the value dataKey", () => {
    const pieData = [
      { region: "North", revenue: 300 },
      { region: "South", revenue: 150 },
      { region: "East", revenue: 50 },
    ];

    const result = buildExportChartData({
      type: "pie",
      data: pieData,
      categoryKey: "region",
      dataKeys: ["revenue"],
      colors: ["#a", "#b", "#c"],
      legend: true,
    });

    expect(result.type).toBe("pie");
    expect(result.data).toEqual([
      {
        name: "revenue",
        labels: ["North", "South", "East"],
        values: [300, 150, 50],
      },
    ]);
  });
});

describe("buildExportChartData — axis titles (string vs non-string)", () => {
  it("populates cat/val titles and their show-flags when labels are strings", () => {
    const result = buildExportChartData({
      type: "bar",
      data: twoSeriesData,
      categoryKey: "month",
      dataKeys: ["sales"],
      colors: ["#111"],
      xAxisLabel: "Month",
      yAxisLabel: "Sales ($)",
    });

    expect(result.options?.catAxisTitle).toBe("Month");
    expect(result.options?.showCatAxisTitle).toBe(true);
    expect(result.options?.valAxisTitle).toBe("Sales ($)");
    expect(result.options?.showValAxisTitle).toBe(true);
  });

  it("omits titles and sets show-flags false when labels are non-string nodes", () => {
    const result = buildExportChartData({
      type: "bar",
      data: twoSeriesData,
      categoryKey: "month",
      dataKeys: ["sales"],
      colors: ["#111"],
      // A React element is not a string → title undefined, flag false.
      xAxisLabel: createElement("span", null, "Month"),
      yAxisLabel: undefined,
    });

    expect(result.options?.catAxisTitle).toBeUndefined();
    expect(result.options?.showCatAxisTitle).toBe(false);
    expect(result.options?.valAxisTitle).toBeUndefined();
    expect(result.options?.showValAxisTitle).toBe(false);
  });
});

describe("buildExportChartData — options passthrough", () => {
  it("carries chartColors and showLegend straight through", () => {
    const result = buildExportChartData({
      type: "line",
      data: twoSeriesData,
      categoryKey: "month",
      dataKeys: ["sales"],
      colors: ["#f00", "#0f0", "#00f"],
      legend: false,
    });

    expect(result.options?.chartColors).toEqual(["#f00", "#0f0", "#00f"]);
    expect(result.options?.showLegend).toBe(false);
  });

  it("merges extraOptions (barDir) after the base options", () => {
    const result = buildExportChartData({
      type: "bar",
      data: twoSeriesData,
      categoryKey: "month",
      dataKeys: ["sales"],
      colors: ["#111"],
      extraOptions: { barDir: "bar" },
    });

    expect(result.options?.barDir).toBe("bar");
    // Base options survive alongside the merged extras.
    expect(result.options?.chartColors).toEqual(["#111"]);
  });

  it("supports both barDir and barGrouping via extraOptions", () => {
    const result = buildExportChartData({
      type: "bar",
      data: twoSeriesData,
      categoryKey: "month",
      dataKeys: ["sales"],
      colors: ["#111"],
      extraOptions: { barDir: "bar", barGrouping: "stacked" },
    });

    expect(result.options?.barDir).toBe("bar");
    expect(result.options?.barGrouping).toBe("stacked");
  });
});

describe("buildExportChartData — customDataTransform", () => {
  it("uses the custom transform in place of the default dataKeys mapping", () => {
    const custom = [{ name: "series", x: [1, 2], y: [3, 4] }];

    const result = buildExportChartData({
      type: "scatter",
      data: twoSeriesData,
      dataKeys: ["sales"], // ignored when customDataTransform is provided
      colors: ["#111"],
      customDataTransform: () => custom,
    });

    expect(result.data).toBe(custom);
  });
});
