// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent, defineFunction, type OpenUIError } from "./index";
import { Renderer } from "./Renderer";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const Show = defineComponent({
  name: "Show",
  description: "Prints a value",
  props: z.object({ value: z.any() }),
  component: ({ props }) => createElement("output", null, JSON.stringify(props.value ?? null)),
});
const Stack = defineComponent({
  name: "Stack",
  description: "Children",
  props: z.object({ children: z.array(z.any()) }),
  component: ({ props, renderNode }) => createElement("div", null, renderNode(props.children)),
});
let ticks = 0;
const Tick = defineFunction({
  name: "Tick",
  description: "A new number on every call",
  params: z.object({}),
  returns: z.number(),
  fn: () => ++ticks,
});
const library = createLibrary({ root: "Stack", components: [Stack, Show], functions: [Tick] });

type Call = { tool: string; args: unknown };
function deferred<T>() {
  let resolve!: (v: T) => void, reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
}

/** Renders a program whose tools answer from `answer(tool, args)` (a value, or a promise to control timing). */
async function harness(answer: (tool: string, args: any) => unknown) {
  const node = document.createElement("div"),
    root = createRoot(node);
  const calls: Call[] = [];
  let errors: OpenUIError[] = [];
  const toolProvider = Object.fromEntries(
    ["customers", "orders", "a", "b", "ta", "tb"].map((tool) => [
      tool,
      async (args: Record<string, unknown>) => {
        calls.push({ tool, args: JSON.parse(JSON.stringify(args ?? null)) });
        return answer(tool, args);
      },
    ]),
  );
  const flush = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
  return {
    calls,
    errors: () => errors,
    shown: () => [...node.querySelectorAll("output")].map((o) => o.textContent),
    flush,
    render: async (response: string) => {
      await act(async () =>
        root.render(
          createElement(Renderer, {
            library,
            response,
            isStreaming: false,
            toolProvider,
            onError: (e) => void (errors = e),
            publishObservability: false,
          }),
        ),
      );
      await flush();
    },
    close: () => act(async () => root.unmount()),
  };
}

const CUSTOMERS = [{ id: 1 }, { id: 2 }];

describe("chained queries", () => {
  it("runs a query that reads another query's result only after that result arrives", async () => {
    const t = await harness((tool, args) =>
      tool === "customers" ? CUSTOMERS : { count: args.ids.length },
    );
    try {
      await t.render(
        `root = Stack([Show(orders.count)])\ncust = Query("customers", {}, [])\norders = Query("orders", {ids: cust.id}, {count: 0})`,
      );
      expect(t.calls).toEqual([
        { tool: "customers", args: {} },
        { tool: "orders", args: { ids: [1, 2] } },
      ]);
      expect(t.shown()).toEqual(["2"]);
    } finally {
      await t.close();
    }
  });

  it("waits while the query it reads is still loading, then runs once", async () => {
    const gate = deferred<unknown>();
    const t = await harness((tool) => (tool === "customers" ? gate.promise : { ok: true }));
    try {
      await t.render(
        `root = Stack([Show(orders)])\ncust = Query("customers", {}, [])\norders = Query("orders", {ids: cust.id}, null)`,
      );
      expect(t.calls.map((c) => c.tool)).toEqual(["customers"]);
      expect(t.shown()).toEqual(["null"]);
      await act(async () => gate.resolve(CUSTOMERS));
      await t.flush();
      expect(t.calls).toEqual([
        { tool: "customers", args: {} },
        { tool: "orders", args: { ids: [1, 2] } },
      ]);
    } finally {
      await t.close();
    }
  });

  it("follows the dependency through a plain statement", async () => {
    const t = await harness((tool) => (tool === "customers" ? CUSTOMERS : []));
    try {
      await t.render(
        `root = Stack([Show(orders)])\ncust = Query("customers", {}, [])\nids = cust.id\norders = Query("orders", {ids: ids}, [])`,
      );
      expect(t.calls).toEqual([
        { tool: "customers", args: {} },
        { tool: "orders", args: { ids: [1, 2] } },
      ]);
    } finally {
      await t.close();
    }
  });

  it("re-runs the dependent query when the query it reads returns a new result", async () => {
    const t = await harness((tool, args) =>
      tool === "customers" ? (args.region === "EU" ? [{ id: 3 }] : CUSTOMERS) : [],
    );
    try {
      const program = (region: string) =>
        `root = Stack([Show(orders)])\ncust = Query("customers", {region: "${region}"}, [])\norders = Query("orders", {ids: cust.id}, [])`;
      await t.render(program("NA"));
      await t.render(program("EU"));
      expect(t.calls).toEqual([
        { tool: "customers", args: { region: "NA" } },
        { tool: "orders", args: { ids: [1, 2] } },
        { tool: "customers", args: { region: "EU" } },
        { tool: "orders", args: { ids: [3] } },
      ]);
    } finally {
      await t.close();
    }
  });

  it("runs independent queries without waiting for each other", async () => {
    const a = deferred<unknown>();
    const t = await harness((tool) => (tool === "a" ? a.promise : 1));
    try {
      await t.render(
        `root = Stack([Show(qa), Show(qb)])\nqa = Query("a", {}, 0)\nqb = Query("b", {}, 0)`,
      );
      expect(t.calls.map((c) => c.tool).sort()).toEqual(["a", "b"]);
      await act(async () => a.resolve(2));
    } finally {
      await t.close();
    }
  });

  it("does not run a dependent query when the query it reads fails", async () => {
    const t = await harness((tool) => {
      if (tool === "customers") throw new Error("down");
      return [];
    });
    try {
      await t.render(
        `root = Stack([Show(orders)])\ncust = Query("customers", {}, [])\norders = Query("orders", {ids: cust.id}, [])`,
      );
      expect(t.calls.map((c) => c.tool)).toEqual(["customers"]);
      expect(t.errors().length).toBeGreaterThan(0);
    } finally {
      await t.close();
    }
  });

  it("does not refetch when a result arrives and nothing waits for it", async () => {
    const circular: Record<string, unknown> = { n: 1 };
    circular.self = circular;
    const t = await harness((tool) => (tool === "a" ? { ok: true } : circular));
    try {
      await t.render(
        `root = Stack([Show(qa.ok), Show(qb.n)])\nqa = Query("a", {t: @Tick()}, {ok: false})\nqb = Query("b", {}, {n: 0})`,
      );
      for (let i = 0; i < 5; i++) await t.flush();
      expect(t.calls.map((c) => c.tool).sort()).toEqual(["a", "b"]);
      expect(t.shown()).toEqual(["true", "1"]);
    } finally {
      await t.close();
    }
  });

  it("runs a query with changing args once when another query waits for it", async () => {
    const t = await harness((tool) => {
      if (t.calls.length > 20) throw new Error("runaway");
      return tool === "a" ? { ok: true } : { n: 1 };
    });
    try {
      await t.render(
        `root = Stack([Show(qb.n)])\nqa = Query("a", {t: @Tick()}, {ok: false})\nqb = Query("b", {x: qa.ok}, {n: 0})`,
      );
      for (let i = 0; i < 5; i++) await t.flush();
      expect(t.calls.map((c) => c.tool)).toEqual(["a", "b"]);
      expect(t.shown()).toEqual(["1"]);
    } finally {
      await t.close();
    }
  });

  it("reports queries that read each other and does not run them", async () => {
    const t = await harness(() => []);
    try {
      await t.render(
        `root = Stack([Show(a), Show(b)])\na = Query("ta", {x: b}, [])\nb = Query("tb", {x: a}, [])`,
      );
      expect(t.calls).toEqual([]);
      expect(t.errors()).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: "query-cycle" })]),
      );
    } finally {
      await t.close();
    }
  });
});
