import { createElement, type ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ColumnChart } from "./ColumnChart";
import { GoalPace } from "./GoalPace";
import { TrendChart } from "./TrendChart";

// Outside a Renderer: a settled dashboard (not streaming, no Query running).
vi.mock("@openuidev/react-lang", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@openuidev/react-lang")>()),
  useIsStreaming: () => false,
  useIsQueryLoading: () => false,
}));

/** Renders a kit component as the runtime does, with props as the model wrote them. */
function render(def: { component: unknown }, props: Record<string, unknown>): string {
  const Component = def.component as ComponentType<{ props: unknown; renderNode: () => null }>;
  return renderToString(createElement(Component, { props, renderNode: () => null }));
}

const labels = ["Mon", "Tue", "Wed"];
// A tool field the model misnamed, or one that has not streamed in yet.
const missing = { name: "Orders" } as unknown as { name: string; values: number[] };

describe.each([
  ["TrendChart", TrendChart, "kit-trend-chart"],
  ["ColumnChart", ColumnChart, "kit-column-chart"],
])("%s with a series missing its values", (_, def, chartClass) => {
  it("waits on the pending state when no series has values", () => {
    const html = render(def, { labels, series: [missing] });
    expect(html).toContain("kit-skel");
    expect(html).not.toContain(chartClass);
  });

  it("drops that series and draws the rest", () => {
    const html = render(def, { labels, series: [missing, { name: "Sales", values: [1, 2, 3] }] });
    expect(html).toContain(chartClass);
    expect(html).not.toContain("kit-skel");
  });
});

describe("GoalPace with a goal missing its arrays", () => {
  it.each([
    ["labels", { label: "Goal", goal: 100, cumulative: [10] }],
    ["cumulative", { label: "Goal", goal: 100, labels }],
  ])("waits on the pending state without %s", (_, goal) => {
    expect(render(GoalPace, { goal })).toContain("kit-skel");
  });
});
