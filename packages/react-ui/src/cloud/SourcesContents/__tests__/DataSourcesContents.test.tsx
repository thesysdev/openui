// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataSourcesContents, sourcesTitle } from "../DataSourcesContents";
import { describeSource, sources } from "../stories/fixtures";
import type { DataSourcesContentsProps } from "../types";

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

function render(props: Partial<DataSourcesContentsProps>) {
  act(() =>
    root.render(
      createElement(DataSourcesContents, { sources, selection: null, describeSource, ...props }),
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

describe("DataSourcesContents", () => {
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

  it("shows a number's Query and Result, and its Formula closed underneath", () => {
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

  it("sums up a one-value Result by its shape, as any other", () => {
    render({ selection: { id: "revenue" } });
    expect(rows()).toEqual(["QuerySQL", "Result (open)", "Formula"]);
    expect(text()).toContain("1 row · 1 field");
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

  // Back and Close are the surrounding surface's; the contents open a
  // query from the list, and show it.
  it("opens a query from the list: its Query, then its Result", () => {
    const onOpenQuery = vi.fn();
    render({ onOpenQuery });
    click(button("dailyQ"));
    expect(onOpenQuery).toHaveBeenCalledWith("dailyQ");
    render({ onOpenQuery, query: "dailyQ" });
    expect(rows()).toEqual(["QuerySQL (open)", "Result"]);
    expect(code()[0]).toContain("GROUP BY 1");
  });

  it("says when the picked component is no longer in the program", () => {
    render({ selection: { id: "gone" } });
    expect(text()).toContain("This is no longer in the dashboard.");
  });

  it("without the app's descriptions, guesses nothing: the tool name and its arguments", () => {
    render({ describeSource: undefined });
    expect(container.querySelectorAll("li")[0]?.textContent).toBe("revenueQpostgres_query");
    expect(container.querySelector("li svg, li .openui-data-sources-dialog__mark")).toBeNull();
    render({ describeSource: undefined, selection: { id: "revenue", prop: "value" } });
    expect(rows()[0]).toBe("Querypostgres_query (open)");
    expect(JSON.parse(code()[0] ?? "")).toEqual({
      sql:
        sources.queries["revenueQ"]?.args &&
        (sources.queries["revenueQ"].args as { sql: string }).sql,
    });
  });
});

describe("sourcesTitle", () => {
  const withProps = (props: Record<string, string>) => ({
    ...sources,
    components: {
      tile: {
        queries: [],
        via: [],
        state: [],
        props: Object.fromEntries(
          Object.entries(props).map(([name, expr]) => [
            name,
            { queries: [], via: [], state: [], expr, components: [] },
          ]),
        ),
      },
    },
  });

  it("names a picked component by its title, label or name, as written", () => {
    expect(sourcesTitle(sources, { id: "revenue", prop: "value" })).toBe("Revenue this quarter");
    expect(sourcesTitle(withProps({ label: '"Orders"', name: '"orders"' }), { id: "tile" })).toBe(
      "Orders",
    );
    expect(sourcesTitle(withProps({ name: '"Signups \\"weekly\\""' }), { id: "tile" })).toBe(
      'Signups "weekly"',
    );
  });

  it("falls back to the id when the label isn't a string literal", () => {
    expect(sourcesTitle(withProps({ title: "headline.text" }), { id: "tile" })).toBe("tile");
    expect(sourcesTitle(withProps({ label: "42" }), { id: "tile" })).toBe("tile");
    expect(sourcesTitle(sources, { id: "kpiRow", prop: "children" })).toBe("kpiRow");
    expect(sourcesTitle(null, { id: "revenue" })).toBe("revenue");
  });

  it("names a component with no label of its own by the nearest one around it", () => {
    const component = (props: Record<string, [string, string[]?]>) => ({
      queries: [],
      via: [],
      state: [],
      props: Object.fromEntries(
        Object.entries(props).map(([name, [expr, components = []]]) => [
          name,
          { queries: [], via: [], state: [], expr, components },
        ]),
      ),
    });
    // Section("Monthly sales", [Card("Last 6 months of data", [Table([...])])])
    const nested = {
      ...sources,
      components: {
        section: component({ title: ['"Monthly sales"'], rows: ["[card]", ["card"]] }),
        card: component({
          title: ['"Last 6 months of data"'],
          content: ["[monthsTable]", ["monthsTable"]],
        }),
        monthsTable: component({ columns: ["[month, sales]", ["monthsTable.1"]] }),
        "monthsTable.1": component({ values: ["monthsQ.rows"] }),
      },
    };
    expect(sourcesTitle(nested, { id: "monthsTable" })).toBe("Last 6 months of data");
    expect(sourcesTitle(nested, { id: "monthsTable.1" })).toBe("Last 6 months of data");
    expect(sourcesTitle(nested, { id: "card" })).toBe("Last 6 months of data");
  });

  it("names a query opened from the list by its name, and the list Sources", () => {
    expect(sourcesTitle(sources, null, "signupsQ")).toBe("signupsQ");
    expect(sourcesTitle(sources, null)).toBe("Sources");
  });
});
