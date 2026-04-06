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

const validationErrors = (input: string) => parse(input, schema).meta.validationErrors;
const codes = (input: string) =>
  validationErrors(input).map((e: { code: string }) => e.code);

// ── unknown-component ────────────────────────────────────────────────────────

describe("unknown-component", () => {
  it("reports when component name is not in schema", () => {
    const result = parse('root = DataTable("col")', schema);
    expect(result.meta.validationErrors).toHaveLength(1);
    expect(result.meta.validationErrors[0]).toMatchObject({
      code: "unknown-component",
      component: "DataTable",
      path: "",
    });
  });

  it("still renders the element with arg0 key when unknown", () => {
    const result = parse('root = DataTable("col")', schema);
    expect(result.root).not.toBeNull();
    expect(result.root?.typeName).toBe("DataTable");
  });

  it("reports all unknown components in a tree", () => {
    const r = codes('root = Stack([Ghost("a")])\n');
    expect(r).toContain("unknown-component");
  });

  it("does not report for known component names", () => {
    const result = parse('root = Stack(["hello"])', schema);
    expect(result.meta.validationErrors).toHaveLength(0);
  });
});

// ── excess-args ───────────────────────────────────────────────────────────────

describe("excess-args", () => {
  it("silently drops extra args beyond param count (no validation error)", () => {
    const result = parse('root = Title("hello", "extra")', schema);
    expect(result.meta.validationErrors).toHaveLength(0);
    expect(result.root).not.toBeNull();
    expect(result.root?.props.text).toBe("hello");
  });

  it("does not report when arg count matches param count", () => {
    expect(codes('root = Title("hello")')).not.toContain("excess-args");
  });

  it("does not report when arg count equals param count for multi-param component", () => {
    expect(codes("root = Table([], [])")).not.toContain("excess-args");
  });
});

// ── unresolved references ────────────────────────────────────────────────────

describe("unresolved references", () => {
  it("tracks unresolved refs in meta.unresolved (one-shot)", () => {
    const result = parse("root = Stack([tbl])", schema);
    expect(result.meta.unresolved).toContain("tbl");
  });

  it("does not produce validation errors for unresolved refs", () => {
    const result = parse("root = Stack([tbl])", schema);
    expect(result.meta.validationErrors).toHaveLength(0);
  });

  it("clears unresolved when ref is defined", () => {
    const result = parse('root = Stack([tbl])\ntbl = Title("hello")', schema);
    expect(result.meta.unresolved).toHaveLength(0);
  });
});

// ── unresolved references (streaming) ─────────────────────────────────────────

describe("unresolved references (streaming)", () => {
  it("tracks unresolved refs mid-stream without validation errors", () => {
    const parser = createStreamParser(schema);
    const midResult = parser.push("root = Stack([tbl])\n");
    expect(midResult.meta.unresolved).toContain("tbl");
    expect(midResult.meta.validationErrors).toHaveLength(0);
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
    expect(result.meta.validationErrors).toHaveLength(0);
  });
});

// ── missing/null-required ─────────────────────────────────────────────────────

describe("missing-required and null-required", () => {
  it("missing-required has correct shape", () => {
    const result = parse("root = Stack()", schema);
    expect(result.meta.validationErrors).toHaveLength(1);
    expect(result.meta.validationErrors[0]).toMatchObject({
      code: "missing-required",
    });
  });

  it("null-required has correct shape", () => {
    const result = parse("root = Stack(null)", schema);
    expect(result.meta.validationErrors).toHaveLength(1);
    expect(result.meta.validationErrors[0]).toMatchObject({
      code: "null-required",
    });
  });
});

// ── structural sharing ────────────────────────────────────────────────────────

describe("structural sharing", () => {
  it("unchanged completed statement nodes are the same reference after a new push", () => {
    const parser = createStreamParser(schema);
    // Build a complete 3-statement program chunk by chunk
    parser.push('root = Stack([header, content])\n');
    parser.push('header = Title("Hello")\n');
    const result1 = parser.push('content = Title("World")\n');

    const children1 = result1.root!.props.children as unknown[];
    expect(children1[0]).not.toBeNull(); // header resolved
    expect(children1[1]).not.toBeNull(); // content resolved

    // Push an additional unrelated statement — header and content are unchanged
    const result2 = parser.push('footer = Title("Footer")\n');
    const children2 = result2.root!.props.children as unknown[];

    // Both child nodes must be the exact same references (structural sharing)
    expect(children2[0]).toBe(children1[0]);
    expect(children2[1]).toBe(children1[1]);
  });

  it("newly resolved sibling does not affect the reference of the already-resolved sibling", () => {
    const parser = createStreamParser(schema);
    parser.push('root = Stack([header, content])\n');
    // Only header is resolved at this point
    const result1 = parser.push('header = Title("Hello")\n');
    const headerNode1 = (result1.root!.props.children as unknown[])[0];
    expect(headerNode1).not.toBeNull();

    // Resolve content — root is re-materialized, but header should be shared
    const result2 = parser.push('content = Title("World")\n');
    const headerNode2 = (result2.root!.props.children as unknown[])[0];

    expect(headerNode2).toBe(headerNode1); // structural sharing
    expect(result2.root).not.toBe(result1.root); // root itself is new (children changed)
  });

  it("multiple subsequent pushes all share the same originally-resolved node", () => {
    const parser = createStreamParser(schema);
    parser.push('root = Stack([header])\n');
    const result1 = parser.push('header = Title("Hello")\n');
    const headerNode1 = (result1.root!.props.children as unknown[])[0];

    // Push several more unrelated statements
    const result2 = parser.push('a = Title("A")\n');
    const result3 = parser.push('b = Title("B")\n');
    const result4 = parser.push('c = Title("C")\n');

    // Every result should have the same header node reference
    expect((result2.root!.props.children as unknown[])[0]).toBe(headerNode1);
    expect((result3.root!.props.children as unknown[])[0]).toBe(headerNode1);
    expect((result4.root!.props.children as unknown[])[0]).toBe(headerNode1);
  });

  it("cache is cleared on reset (set with non-prefix content)", () => {
    const parser = createStreamParser(schema);
    parser.push('root = Stack([header])\n');
    const result1 = parser.push('header = Title("Hello")\n');
    const headerNode1 = (result1.root!.props.children as unknown[])[0];

    // set() with text that doesn't start with the current buffer triggers reset.
    // Using different title text ensures the strings diverge and reset() fires.
    const result2 = parser.set('root = Stack([header])\nheader = Title("World")\n');
    const headerNode2 = (result2.root!.props.children as unknown[])[0];

    // After reset, nodes are freshly materialized — NOT the same reference
    expect(headerNode2).not.toBe(headerNode1);
  });

  it("incomplete pending statement does not get cached (always re-materialized)", () => {
    const parser = createStreamParser(schema);
    parser.push('root = Stack([header])\n');
    // Push header incompletely (no trailing newline — stays as pending)
    const result1 = parser.push('header = Title("Hell');
    const headerNode1 = (result1.root?.props.children as unknown[] | undefined)?.[0];

    // Push more characters — pending statement changes each time
    const result2 = parser.push('o")');
    const headerNode2 = (result2.root?.props.children as unknown[] | undefined)?.[0];

    // Both may be non-null (auto-closed) but must NOT be the same cached reference
    // since the pending statement is always re-parsed
    if (headerNode1 != null && headerNode2 != null) {
      expect(headerNode2).not.toBe(headerNode1);
    }
  });
});
