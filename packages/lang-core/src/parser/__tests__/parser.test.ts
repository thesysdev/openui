import { describe, expect, it } from "vitest";
import type { ParamMap } from "../parser";
import { createStreamParser, parse } from "../parser";

// ── Test schema ──────────────────────────────────────────────────────────────

/**
 * Minimal schema used across tests.
 *
 * Stack takes one param (children), Title takes one (text),
 * Table takes two (columns, rows). These cover the common test cases.
 */
const schema: ParamMap = new Map([
  ["Stack", { params: [{ name: "children", required: true }] }],
  ["Title", { params: [{ name: "text", required: true }] }],
  [
    "Table",
    {
      params: [
        { name: "columns", required: true },
        { name: "rows", required: true },
      ],
    },
  ],
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

const errors = (input: string) => parse(input, schema).meta.errors;
const codes = (input: string) => errors(input).map((e: { code: string }) => e.code);

// ── unknown-component ────────────────────────────────────────────────────────

describe("unknown-component", () => {
  it("reports when component name is not in schema", () => {
    const result = parse('root = DataTable("col")', schema);
    expect(result.meta.errors).toHaveLength(1);
    expect(result.meta.errors[0]).toMatchObject({
      type: "validation",
      code: "unknown-component",
      component: "DataTable",
      path: "",
    });
  });

  it("still renders the element with _args when unknown", () => {
    const result = parse('root = DataTable("col")', schema);
    expect(result.root).not.toBeNull();
    expect(result.root?.typeName).toBe("DataTable");
    expect((result.root?.props as any)._args).toEqual(["col"]);
  });

  it("reports all unknown components in a tree", () => {
    const r = codes('root = Stack([Ghost("a")])\n');
    expect(r).toContain("unknown-component");
  });

  it("does not report for known component names", () => {
    const result = parse('root = Stack(["hello"])', schema);
    expect(codes('root = Stack(["hello"])')).not.toContain("unknown-component");
    expect(result.meta.errors).toHaveLength(0);
  });
});

// ── excess-args ───────────────────────────────────────────────────────────────

describe("excess-args", () => {
  it("reports when more args are passed than params", () => {
    const result = parse('root = Title("hello", "extra")', schema);
    expect(result.meta.errors).toHaveLength(1);
    expect(result.meta.errors[0]).toMatchObject({
      type: "validation",
      code: "excess-args",
      component: "Title",
      path: "",
    });
    expect(result.meta.errors[0].message).toMatch(/takes 1 arg/);
  });

  it("still renders the component despite excess args", () => {
    const result = parse('root = Title("hello", "extra")', schema);
    expect(result.root).not.toBeNull();
    expect(result.root?.props.text).toBe("hello");
  });

  it("does not report when arg count matches param count", () => {
    expect(codes('root = Title("hello")')).not.toContain("excess-args");
  });

  it("does not report when fewer args than params (handled by missing-required)", () => {
    expect(codes("root = Table([], [])")).not.toContain("excess-args");
  });
});

// ── unresolved references ────────────────────────────────────────────────────

describe("unresolved references", () => {
  it("tracks unresolved refs in meta.unresolved (one-shot)", () => {
    const result = parse("root = Stack([tbl])", schema);
    expect(result.meta.unresolved).toContain("tbl");
  });

  it("does not produce errors for unresolved refs", () => {
    const result = parse("root = Stack([tbl])", schema);
    expect(result.meta.errors).toHaveLength(0);
  });

  it("clears unresolved when ref is defined", () => {
    const result = parse('root = Stack([tbl])\ntbl = Title("hello")', schema);
    expect(result.meta.unresolved).toHaveLength(0);
  });
});

// ── unresolved references (streaming) ─────────────────────────────────────────

describe("unresolved references (streaming)", () => {
  it("tracks unresolved refs mid-stream without errors", () => {
    const parser = createStreamParser(schema);
    const midResult = parser.push("root = Stack([tbl])\n");
    expect(midResult.meta.unresolved).toContain("tbl");
    expect(midResult.meta.errors).toHaveLength(0);
  });

  it("resolves automatically when ref is defined in a later chunk", () => {
    const parser = createStreamParser(schema);
    parser.push("root = Stack([tbl])\n");
    const result = parser.push('tbl = Title("hello")\n');
    expect(result.meta.unresolved).toHaveLength(0);
  });

  it("keeps unresolved refs in meta.unresolved at end of stream", () => {
    const parser = createStreamParser(schema);
    parser.push("root = Stack([tbl])\n");
    const result = parser.getResult();
    expect(result.meta.unresolved).toContain("tbl");
    expect(result.meta.errors).toHaveLength(0);
  });
});

// ── existing error rules ──────────────────────────────────────────────────────

describe("existing errors carry type and code", () => {
  it("missing-required has correct shape", () => {
    const result = parse("root = Stack()", schema);
    expect(result.meta.errors).toHaveLength(1);
    expect(result.meta.errors[0]).toMatchObject({
      type: "validation",
      code: "missing-required",
    });
  });

  it("null-required has correct shape", () => {
    const result = parse("root = Stack(null)", schema);
    expect(result.meta.errors).toHaveLength(1);
    expect(result.meta.errors[0]).toMatchObject({
      type: "validation",
      code: "null-required",
    });
  });
});
