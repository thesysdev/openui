import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { ScatterChart as ScatterChartComponent } from "../../components/Charts";
import { ScatterChart } from "../Charts/ScatterChart";

const render = (props: Record<string, unknown>) =>
  ScatterChart.component({ props, renderNode: () => null } as never) as ReactElement<
    Record<string, unknown>
  >;

const datasets = [{ name: "Players", points: [{ x: 180, y: 75 }] }];

describe("ScatterChart", () => {
  it("passes xLabel and yLabel to the chart as axis labels", () => {
    const element = render({ datasets, xLabel: "Height (cm)", yLabel: "Weight (kg)" });

    expect(element.type).toBe(ScatterChartComponent);
    expect(element.props["xAxisLabel"]).toBe("Height (cm)");
    expect(element.props["yAxisLabel"]).toBe("Weight (kg)");
  });

  it("leaves the axis labels unset when they are omitted", () => {
    const element = render({ datasets });

    expect(element.props["xAxisLabel"]).toBeUndefined();
    expect(element.props["yAxisLabel"]).toBeUndefined();
  });
});
