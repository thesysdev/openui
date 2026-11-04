/**
 * Data structure for chart export (e.g., to PPTX)
 */
export type ExportChartData = {
  type: "line" | "bar" | "area" | "pie" | "radar" | "scatter";
  data: {
    name: string;
    labels?: string[];
    values?: number[];
    x?: number[];
    y?: number[];
  }[];
  options?: {
    chartColors?: string[];
    showLegend?: boolean;
    legendPos?: "b" | "t" | "l" | "r";
    title?: string;
    showTitle?: boolean;
    catAxisTitle?: string;
    showCatAxisTitle?: boolean;
    valAxisTitle?: string;
    showValAxisTitle?: boolean;
    lineSize?: number;
    barDir?: "bar" | "col";
    barGrouping?: "stacked" | "clustered" | "percent" | "standard";
  };
};
