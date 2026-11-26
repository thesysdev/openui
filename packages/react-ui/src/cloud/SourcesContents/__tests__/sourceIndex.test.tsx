// @vitest-environment jsdom
import {
  createLibrary,
  defineComponent,
  Renderer,
  useDataSources,
  type DataSources,
  type Library,
} from "@openuidev/react-lang";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { Col, Table } from "../../../genui-lib/Table";
import { sourceIndex } from "../sourceIndex";
import { dashboardLibrary, fullFlowProgram } from "../stories/fixtures";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** The provenance a program really has: what `useDataSources()` reads inside `Renderer`. */
function provenanceOf(program: string, library: Library = dashboardLibrary): DataSources {
  let found: DataSources | null = null;
  function Capture() {
    found = useDataSources();
    return null;
  }
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() =>
    root.render(createElement(Renderer, { response: program, library }, createElement(Capture))),
  );
  act(() => root.unmount());
  if (!found) throw new Error("no provenance");
  return found;
}

describe("sourceIndex", () => {
  it("finds the KPIs, the margin, the chart and the table as data-bound, and nothing else", () => {
    const index = sourceIndex(provenanceOf(fullFlowProgram));
    expect([...index.components.keys()]).toEqual([
      "revenue",
      "signups",
      "margin",
      "channels",
      "daily",
    ]);
  });

  it("lists the margin's formula and both queries it reads, formula first", () => {
    const index = sourceIndex(provenanceOf(fullFlowProgram));
    expect(index.components.get("margin")?.sources).toEqual(["grossMargin", "revenueQ", "costQ"]);
    expect(index.components.get("revenue")?.sources).toEqual(["now", "revenueQ"]);
    expect(index.components.get("daily")?.sources).toEqual(["dailyQ"]);
  });

  it("lists every source once, with its kind and the components that use it", () => {
    const index = sourceIndex(provenanceOf(fullFlowProgram));
    const listed = [...index.sources.values()].map(({ name, kind, usedBy }) => ({
      name,
      kind,
      usedBy,
    }));
    expect(listed).toEqual([
      { name: "revenueQ", kind: "query", usedBy: ["revenue", "margin"] },
      { name: "costQ", kind: "query", usedBy: ["margin"] },
      { name: "dailyQ", kind: "query", usedBy: ["daily"] },
      { name: "signupsQ", kind: "query", usedBy: ["signups"] },
      { name: "channelsQ", kind: "query", usedBy: ["channels"] },
      { name: "now", kind: "formula", usedBy: ["revenue"] },
      { name: "grossMargin", kind: "formula", usedBy: ["margin"] },
    ]);
  });

  it("carries each query's call and each formula's text", () => {
    const index = sourceIndex(provenanceOf(fullFlowProgram));
    const cost = index.sources.get("costQ");
    expect(cost?.kind === "query" && cost.query.toolName).toBe("postgres_query");
    const margin = index.sources.get("grossMargin");
    expect(margin?.kind === "formula" && margin.text).toContain("@First(costQ.rows).cost");
  });

  it("finds nothing data-bound in a program with no queries", () => {
    const index = sourceIndex(
      provenanceOf(`root = Board([heading, total])
heading = Heading("Plan")
base = 1200
total = Kpi("Total", base * 2)`),
    );
    expect(index.components.size).toBe(0);
    expect(index.sources.size).toBe(0);
  });

  it("leaves out a component whose value is a literal, beside one that reads a query", () => {
    const index = sourceIndex(
      provenanceOf(`root = Board([goal, revenue])
revenueQ = Query("postgres_query", {sql: "SELECT 1"}, {rows: []})
goal = Kpi("Goal", 250000)
revenue = Kpi("Revenue", @First(revenueQ.rows).revenue)`),
    );
    expect([...index.components.keys()]).toEqual(["revenue"]);
    expect(index.sources.get("revenueQ")?.usedBy).toEqual(["revenue"]);
  });

  it("names the props that read data, where the value is shown", () => {
    const index = sourceIndex(provenanceOf(fullFlowProgram));
    expect(index.components.get("revenue")?.props).toEqual(["value"]);
    expect(index.components.get("daily")?.props).toEqual(["rows"]);
  });

  it("counts a table's columns, which render nothing, as the table's own data", () => {
    const Board = defineComponent({
      name: "Board",
      props: z.object({ children: z.array(z.any()) }),
      description: "Tiles.",
      component: ({ props, renderNode }) => createElement("div", null, renderNode(props.children)),
    });
    const library = createLibrary({ root: "Board", components: [Board, Table, Col] });
    const provenance = provenanceOf(
      `root = Board([daily])
dailyQ = Query("postgres_query", {sql: "SELECT 1"}, {rows: []})
daily = Table([Col("Day", dailyQ.rows.day), Col("Revenue", dailyQ.rows.revenue)])`,
      library,
    );
    const columns = Object.keys(provenance.components).filter((id) => id.startsWith("daily."));
    const index = sourceIndex(provenance, { renders: (id) => !columns.includes(id) });
    expect([...index.components.keys()]).toEqual(["daily"]);
    expect(index.components.get("daily")).toMatchObject({
      props: ["columns"],
      sources: ["dailyQ"],
    });
    expect(index.sources.get("dailyQ")?.usedBy).toEqual(["daily"]);
  });
});
