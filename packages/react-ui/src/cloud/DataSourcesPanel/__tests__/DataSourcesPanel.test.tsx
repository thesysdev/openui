// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataSourcesPanel } from "../DataSourcesPanel";
import {
  components,
  describeSource,
  queries,
  runCall,
  scriptInputs,
  sourcesFor,
} from "../stories/fixtures";
import type { DataSourcesPanelProps, DataSourcesSelection } from "../types";

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

function render(props: Partial<DataSourcesPanelProps> & { selection?: DataSourcesSelection }) {
  const selection = props.selection ?? null;
  act(() =>
    root.render(
      createElement(DataSourcesPanel, {
        queries,
        components,
        describeSource,
        scriptInputs,
        runCall,
        sources: selection ? (sourcesFor[selection.id] ?? null) : null,
        ...props,
        selection,
      }),
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
const listed = () =>
  [...container.querySelectorAll(".openui-data-sources-panel__list-label")].map(
    (el) => el.textContent,
  );

describe("DataSourcesPanel", () => {
  it("lists every source with nothing selected, named after what reads it", () => {
    render({});
    expect(listed()).toEqual([
      "Revenue this quarter",
      // Two components read dailyQ, so it keeps its own name.
      "Daily",
      "Sessions by channel",
      "Weekly signups",
      "Revenue vs target",
    ]);
  });

  it("filters the list by name, kind and the components that read a source", () => {
    render({});
    const input = container.querySelector("input")!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(input, "posthog");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(listed()).toEqual(["Weekly signups"]);
  });

  it("shows a number under its source, with the query one click away", () => {
    render({ selection: { id: "revenue", prop: "value", value: "$184,920" } });
    expect(container.querySelector("h2")?.textContent).toBe("Revenue this quarter");
    expect(text()).toContain("Postgres · Retail prod");
    expect(text()).toContain("$184,920");
    expect(text()).toContain("Paid orders since Oct 1");
    expect(container.querySelector("pre")).toBeNull();
    click(button("Query"));
    expect(container.querySelector("pre")?.textContent).toContain("FROM orders");
  });

  it("opens a chart's source with a preview of its data and the tables it reads", () => {
    render({ selection: { id: "daily" } });
    expect(container.querySelector("h2")?.textContent).toBe("Daily revenue");
    expect(container.querySelector(".openui-data-sources-panel__identity-name")?.textContent).toBe(
      "orders",
    );
    expect(container.querySelectorAll("tbody tr")).toHaveLength(7);
    expect(text()).toContain("7 rows · 3 fields");
  });

  it("lists the other components that read the same data and selects one", () => {
    const onSelect = vi.fn();
    render({ selection: { id: "daily" }, onSelect });
    click(button("Also used by"));
    click(button("Daily orders"));
    expect(onSelect).toHaveBeenCalledWith("dailyTable");
  });

  it("shows the formula for a value computed in the program", () => {
    render({ selection: { id: "margin", prop: "value", value: "38.6%" } });
    expect(container.querySelector("h2")?.textContent).toBe("Computed in the dashboard");
    const formula = container.querySelector("pre")?.textContent ?? "";
    expect(formula).toContain("value: grossMargin");
    expect(formula).toContain("grossMargin = (revenue - cogs) / revenue");
  });

  it("lists a script's inputs and fetches one's data on demand", async () => {
    const run = vi.fn(runCall);
    render({ selection: { id: "target" }, runCall: run });
    expect(listed()).toEqual(["Postgres query", "regional_targets.csv"]);
    click(button("regional_targets.csv"));
    await act(async () => {});
    expect(run).toHaveBeenCalledWith({ name: "read_file", args: { file: "regional_targets.csv" } });
    expect(container.querySelector("h2")?.textContent).toBe("regional_targets.csv");
    expect(text()).toContain("File · read by Revenue vs target");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
  });

  it("goes back along the way it came, then to the list", () => {
    const onClearSelection = vi.fn();
    render({ selection: { id: "daily" }, onClearSelection });
    click(button("orders"));
    expect(container.querySelector("h2")?.textContent).toBe("Daily");
    click(button("Back"));
    expect(container.querySelector("h2")?.textContent).toBe("Daily revenue");
    click(button("Back"));
    expect(onClearSelection).toHaveBeenCalled();
  });

  it("without the app's descriptions, names a tool after itself", () => {
    render({ selection: { id: "channels" }, describeSource: undefined });
    click(button("Request"));
    expect(container.querySelector("pre")?.textContent).toContain("sessionDefaultChannelGroup");
    render({ describeSource: undefined });
    expect(listed()).toContain("Channels");
  });
});
