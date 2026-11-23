// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataSourcesPanel } from "../DataSourcesPanel";
import { describeSource, sources } from "../stories/fixtures";
import type { DataSourcesPanelProps } from "../types";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(props: Partial<DataSourcesPanelProps>) {
  act(() =>
    root.render(
      createElement(DataSourcesPanel, { sources, selection: null, describeSource, ...props }),
    ),
  );
}

const text = () => container.textContent ?? "";
const button = (name: string) =>
  [...container.querySelectorAll("button")].find(
    (el) => el.textContent?.trim().startsWith(name) || el.getAttribute("aria-label") === name,
  );
const click = (el: Element | undefined) => {
  if (!el) throw new Error("no such element");
  act(() => (el as HTMLElement).click());
};
/** Each row: its label and note, and whether it's open. */
const rows = () =>
  [...container.querySelectorAll<HTMLButtonElement>("[aria-expanded]")].map(
    (el) =>
      `${el.textContent?.trim()}${el.getAttribute("aria-expanded") === "true" ? " (open)" : ""}`,
  );
const code = () => [...container.querySelectorAll("pre")].map((el) => el.textContent);

describe("DataSourcesPanel", () => {
  it("lists every query, in program order, named by the app", () => {
    render({});
    const items = [...container.querySelectorAll("li")].map((el) => el.textContent);
    expect(items).toEqual([
      "revenueQPostgres",
      "dailyQPostgres",
      "signupsQPostHog",
      "channelsQGA4",
      "targetQScript",
    ]);
    expect(container.querySelector("input")).toBeNull();
  });

  it("shows a number's Query, Result and Formula, and nothing else", () => {
    render({ selection: { id: "revenue", prop: "value" } });
    expect(rows()).toEqual(["QuerySQL (open)", "Result", "Formula"]);
    expect(code()[0]).toContain("FROM orders");
    click(button("Formula"));
    expect(code()).toContain("value: now.revenue\n\nnow = @First(revenueQ.rows)");
    expect(text()).not.toContain("Revenue this quarter");
  });

  it("opens a table's Result: its rows and a summary", () => {
    render({ selection: { id: "daily" } });
    expect(rows()).toEqual(["QuerySQL", "Result (open)"]);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(7);
    expect(text()).toContain("7 rows · 3 fields");
  });

  it("shows only the Formula when no query is behind a value", () => {
    render({ selection: { id: "margin", prop: "value" } });
    expect(rows()).toEqual(["Formula (open)"]);
    expect(code()).toEqual(["value: grossMargin\n\ngrossMargin = (revenue - cogs) / revenue"]);
  });

  it("shows a value written in the program as its Formula", () => {
    render({ selection: { id: "goal", prop: "value" } });
    expect(rows()).toEqual(["Formula (open)"]);
    expect(code()).toEqual(["value: 250000"]);
  });

  it("shows a container's children's queries, each named", () => {
    render({ selection: { id: "kpiRow", prop: "children" } });
    expect(rows()).toEqual([
      "QueryrevenueQ · SQL (open)",
      "ResultrevenueQ",
      "QuerysignupsQ · HogQL",
      "ResultsignupsQ",
      "Formula",
    ]);
  });

  it("shows a script's call, as the app describes it, as its Query", () => {
    render({ selection: { id: "target" } });
    click(button("Query"));
    expect(code()[0]).toContain("revenue_vs_target()");
    expect(rows()[0]).toBe("QueryScript (open)");
  });

  it("goes back to every query, and closes", () => {
    const onBack = vi.fn();
    const onClose = vi.fn();
    render({ selection: { id: "daily" }, onBack, onClose });
    click(button("Back to all queries"));
    click(button("Close"));
    expect(onBack).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("says when the picked component is no longer in the program", () => {
    render({ selection: { id: "gone" } });
    expect(text()).toContain("This is no longer in the dashboard.");
  });

  it("without the app's descriptions, names a tool after itself", () => {
    render({ describeSource: undefined });
    expect(container.querySelectorAll("li")[3]?.textContent).toBe("channelsQGa4 report");
    render({ describeSource: undefined, selection: { id: "channels" } });
    click(button("Query"));
    expect(code()[0]).toContain("sessionDefaultChannelGroup");
  });
});
