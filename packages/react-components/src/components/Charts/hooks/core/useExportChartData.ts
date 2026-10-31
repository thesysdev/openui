import { useMemo } from "react";

import type { ExportChartData } from "../../types";
// react-ui's PRINT CONTEXT (a React context; falsy outside
// <PrintContextProvider>). Deliberately NOT the charts'
// `usePrintContext` (hooks/core/usePrintContext.ts) — that one is a
// media-query hook returning a boolean for `@media print`, a different
// concern.
import { usePrintContext as useReactUiPrintContext } from "../../../../context/PrintContext";

/** Props for the print-export emitter (`data-openui-chart` JSON). */
export interface UseExportChartDataProps {
  type: ExportChartData["type"];
  data: Array<Record<string, unknown>>;
  categoryKey?: string;
  dataKeys?: string[];
  colors: string[];
  legend?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  extraOptions?: Omit<
    NonNullable<ExportChartData["options"]>,
    "chartColors" | "showLegend" | "catAxisTitle" | "valAxisTitle"
  >;
  /** For specialized charts (e.g. scatter) that shape their series manually. */
  customDataTransform?: () => ExportChartData["data"];
}

/**
 * PURE transform: props → the `ExportChartData` object. Extracted from the
 * hook so it can be unit-tested without a React/DOM environment (the hook
 * itself needs a provider and is exercised at runtime):
 *   • 2D charts → one series per `dataKeys` entry, `labels` = the category
 *     value of every row, `values` = `Number(row[key])` of every row.
 *   • options → `chartColors`, `showLegend`, the cat/val axis-title pair
 *     (present only when the label is a string), then `...extraOptions`.
 */
export function buildExportChartData({
  type,
  data,
  categoryKey,
  dataKeys,
  colors,
  legend,
  xAxisLabel,
  yAxisLabel,
  extraOptions,
  customDataTransform,
}: UseExportChartDataProps): ExportChartData {
  const chartData: ExportChartData["data"] = customDataTransform
    ? customDataTransform()
    : (dataKeys || []).map((key) => ({
        name: key,
        labels: data.map((item) => (categoryKey ? String(item[categoryKey]) : "")),
        values: data.map((item) => Number(item[key])),
      }));

  return {
    type,
    data: chartData,
    options: {
      chartColors: colors,
      showLegend: legend,
      catAxisTitle: typeof xAxisLabel === "string" ? xAxisLabel : undefined,
      showCatAxisTitle: typeof xAxisLabel === "string",
      valAxisTitle: typeof yAxisLabel === "string" ? yAxisLabel : undefined,
      showValAxisTitle: typeof yAxisLabel === "string",
      ...extraOptions,
    },
  };
}

/**
 * Emits the `data-openui-chart` payload for PPTX export. Returns the JSON string ONLY inside a
 * react-ui `<PrintContextProvider>` (the export path); `undefined` otherwise,
 * so a chart binding `data-openui-chart={exportData}` drops the attribute
 * entirely off the print path (React omits `undefined` attributes). Charts that
 * pass the result to a container which sets its own `data-openui-chart` (the
 * cartesian layout does) let this value take precedence when defined.
 */
export const useExportChartData = (props: UseExportChartDataProps): string | undefined => {
  const printContext = useReactUiPrintContext();

  const {
    type,
    data,
    categoryKey,
    dataKeys,
    colors,
    legend,
    xAxisLabel,
    yAxisLabel,
    extraOptions,
    customDataTransform,
  } = props;

  // The memo body reads only these locals (the destructured fields + the print
  // context), so the dep array is complete.
  return useMemo(() => {
    if (!printContext) {
      return undefined;
    }
    return JSON.stringify(
      buildExportChartData({
        type,
        data,
        categoryKey,
        dataKeys,
        colors,
        legend,
        xAxisLabel,
        yAxisLabel,
        extraOptions,
        customDataTransform,
      }),
    );
  }, [
    type,
    data,
    dataKeys,
    categoryKey,
    colors,
    legend,
    xAxisLabel,
    yAxisLabel,
    extraOptions,
    customDataTransform,
    printContext,
  ]);
};
