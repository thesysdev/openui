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
      code: "unknown-component",
      component: "DataTable",
    });
  });

  it("drops unknown component from tree (returns null)", () => {
    const result = parse('root = DataTable("col")', schema);
    expect(result.root).toBeNull();
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
  it("reports excess-args error but still renders with valid args", () => {
    const result = parse('root = Title("hello", "extra")', schema);
    expect(codes('root = Title("hello", "extra")')).toContain("excess-args");
    // Extra args dropped, first arg maps correctly
    expect(result.root).not.toBeNull();
    expect(result.root?.props.text).toBe("hello");
  });

  it("excess-args message lists count", () => {
    const errs = errors('root = Title("hello", "extra", "more")');
    const excess = errs.find((e: { code: string }) => e.code === "excess-args");
    expect(excess).toBeDefined();
    expect(excess!.message).toContain("2 excess dropped");
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
      code: "missing-required",
      component: "Stack",
    });
  });

  it("null-required has correct shape", () => {
    const result = parse("root = Stack(null)", schema);
    expect(result.meta.errors).toHaveLength(1);
    expect(result.meta.errors[0]).toMatchObject({
      code: "null-required",
      component: "Stack",
    });
  });
});

// ── array null-dropping ─────────────────────────────────────────────────────

describe("array null-dropping", () => {
  it("drops unresolved refs from children arrays", () => {
    const result = parse('root = Stack([missing, t1])\nt1 = Title("ok")', schema);
    const children = result.root?.props?.children as any[];
    expect(children).toHaveLength(1);
    expect(children[0].typeName).toBe("Title");
  });

  it("drops invalid components (missing required props) from arrays", () => {
    const result = parse('root = Stack([bad, good])\nbad = Title()\ngood = Title("ok")', schema);
    const children = result.root?.props?.children as any[];
    expect(children).toHaveLength(1);
    expect(children[0].props.text).toBe("ok");
  });

  it("drops unknown components from arrays", () => {
    const result = parse('root = Stack([u, t1])\nu = Ghost("x")\nt1 = Title("ok")', schema);
    const children = result.root?.props?.children as any[];
    expect(children).toHaveLength(1);
    expect(children[0].typeName).toBe("Title");
  });

  it("preserves null literals in arrays", () => {
    const result = parse("root = Stack([null, null])", schema);
    const children = result.root?.props?.children as any[];
    expect(children).toEqual([null, null]);
  });

  it("streaming: unresolved refs fill in when defined later", () => {
    const sp = createStreamParser(schema);
    const p1 = sp.push('root = Stack([t1, t2])\nt1 = Title("first")\n');
    expect((p1.root?.props?.children as any[]).length).toBe(1);
    const p2 = sp.push('t2 = Title("second")\n');
    expect((p2.root?.props?.children as any[]).length).toBe(2);
  });
});

// ── orphaned statements ─────────────────────────────────────────────────────

describe("orphaned statements", () => {
  it("detects unreachable statements on complete parse", () => {
    const result = parse(
      'root = Stack([t1])\nt1 = Title("used")\norphan = Title("unused")',
      schema,
    );
    expect(result.meta.orphaned).toContain("orphan");
    expect(result.meta.orphaned).not.toContain("t1");
    expect(result.meta.orphaned).not.toContain("root");
  });

  it("no orphans when all statements are reachable", () => {
    const result = parse('root = Stack([t1, t2])\nt1 = Title("a")\nt2 = Title("b")', schema);
    expect(result.meta.orphaned).toHaveLength(0);
  });

  it("orphaned computed during streaming too", () => {
    const sp = createStreamParser(schema);
    // orphan is defined but not referenced from root
    const p1 = sp.push('root = Stack([t1])\nt1 = Title("a")\norphan = Title("stray")\n');
    expect(p1.meta.orphaned).toContain("orphan");
    expect(p1.meta.orphaned).not.toContain("t1");
  });

  it("detects multiple orphaned statements", () => {
    const result = parse(
      'root = Stack([t1])\nt1 = Title("used")\na = Title("x")\nb = Title("y")',
      schema,
    );
    expect(result.meta.orphaned).toContain("a");
    expect(result.meta.orphaned).toContain("b");
    expect(result.meta.orphaned).toHaveLength(2);
  });

  it("deeply nested refs are not orphaned", () => {
    const result = parse(
      'root = Stack([t1])\nt1 = Table([col], rows)\ncol = Title("Name")\nrows = [["Alice"]]',
      schema,
    );
    expect(result.meta.orphaned).toHaveLength(0);
  });
});

// ── type-mismatch ───────────────────────────────────────────────────────────

const typedSchema: ParamMap = new Map([
  [
    "Header",
    {
      params: [
        { name: "title", required: true, type: "string" },
        { name: "icon", required: false, type: "string" },
      ],
    },
  ],
  [
    "Chart",
    {
      params: [
        { name: "title", required: true, type: "string" },
        { name: "data", required: true, type: "array" },
      ],
    },
  ],
]);

describe("type-mismatch", () => {
  it("reports when literal arg type does not match expected type", () => {
    // Chart(title: string, data: array) called with (array, string) — both swapped
    const result = parse('root = Chart([1, 2], "Revenue")', typedSchema);
    const errs = result.meta.errors.filter((e) => e.code === "type-mismatch");
    expect(errs).toHaveLength(2);
    expect(errs[0]).toMatchObject({
      code: "type-mismatch",
      component: "Chart",
      path: "/title",
    });
    expect(errs[0].message).toContain("expects string, got array");
    expect(errs[1]).toMatchObject({
      code: "type-mismatch",
      component: "Chart",
      path: "/data",
    });
    expect(errs[1].message).toContain("expects array, got string");
  });

  it("does not report when types match", () => {
    const result = parse('root = Chart("Revenue", [1, 2])', typedSchema);
    expect(result.meta.errors.filter((e) => e.code === "type-mismatch")).toHaveLength(0);
  });

  it("skips check for non-literal args (Ref)", () => {
    const result = parse('myData = [1, 2]\nroot = Chart(myData, [1, 2])', typedSchema);
    // myData is a Ref — can't infer type at parse time
    expect(result.meta.errors.filter((e) => e.code === "type-mismatch")).toHaveLength(0);
  });

  it("skips check for null args (handled by null-required)", () => {
    const result = parse('root = Header(null, "icon")', typedSchema);
    expect(result.meta.errors.filter((e) => e.code === "type-mismatch")).toHaveLength(0);
  });

  it("component still renders despite type mismatch (non-fatal)", () => {
    const result = parse('root = Header(42, "icon")', typedSchema);
    expect(result.meta.errors.some((e) => e.code === "type-mismatch")).toBe(true);
    expect(result.root).not.toBeNull();
    expect(result.root?.props.title).toBe(42);
  });

  it("reports number where string expected", () => {
    const result = parse("root = Header(42)", typedSchema);
    const errs = result.meta.errors.filter((e) => e.code === "type-mismatch");
    expect(errs).toHaveLength(1);
    expect(errs[0].message).toContain("expects string, got number");
  });

  it("reports object where string expected", () => {
    const result = parse('root = Header({key: "val"})', typedSchema);
    const errs = result.meta.errors.filter((e) => e.code === "type-mismatch");
    expect(errs).toHaveLength(1);
    expect(errs[0].message).toContain("expects string, got object");
  });

  it("does not check when schema has no type", () => {
    // Using the base schema (no type) — should never produce type-mismatch
    const result = parse('root = Stack(42)', schema);
    expect(result.meta.errors.filter((e) => e.code === "type-mismatch")).toHaveLength(0);
  });
});

