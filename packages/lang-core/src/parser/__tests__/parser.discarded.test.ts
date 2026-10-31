import { describe, expect, it } from "vitest";
import { createStreamParser, parse } from "../parser";
import type { ParamMap } from "../types";

const schema: ParamMap = new Map([
  ["Stack", { params: [{ name: "children", required: true }] }],
  ["Title", { params: [{ name: "text", required: true }] }],
]);

/** Feeds `input` to a stream parser in `size`-character chunks and returns
 *  every intermediate result plus the final complete one. */
function streamAll(input: string, size: number) {
  const parser = createStreamParser(schema);
  const results = [];
  for (let i = 0; i < input.length; i += size) results.push(parser.push(input.slice(i, i + size)));
  results.push(parser.getResult(true));
  return results;
}

describe("meta.discarded on valid programs", () => {
  it("is empty for a multiline program with forward references", () => {
    const input =
      'root = Stack([\n  title,\n  sub\n])\ntitle = Title("Hello")\nsub = Title("World")';
    const result = parse(input, schema);
    expect(result.root?.typeName).toBe("Stack");
    expect(result.meta.discarded).toEqual([]);
  });

  it("is empty for a multiline ternary continuation", () => {
    const input = '$on = true\nroot = $on\n  ? Title("on")\n  : Title("off")';
    expect(parse(input, schema).meta.discarded).toEqual([]);
  });

  it("stays empty on every chunk of a valid stream, including a half-written statement", () => {
    const input = 'root = Stack([title])\ntitle = Title("Hello")\n';
    for (const size of [1, 3, 7]) {
      for (const result of streamAll(input, size)) expect(result.meta.discarded).toEqual([]);
    }
  });
});

describe("meta.discarded: invalid-statement", () => {
  it("reports a bare component call that is not a statement", () => {
    const input = 'root = Stack([title])\ntitle = Title("Hello")\nTitle("bare")';
    const result = parse(input, schema);
    expect(result.root?.typeName).toBe("Stack");
    expect(result.meta.discarded).toEqual([{ kind: "invalid-statement" }]);
  });

  it("reports an identifier line with no equals sign", () => {
    const result = parse("root = Stack([])\nroot Stack([])", schema);
    expect(result.meta.discarded).toEqual([{ kind: "invalid-statement" }]);
  });

  it.each([
    'root = Title("Shown")\nunused =',
    'root = Title("Shown")\nunused =\nnext = Title("Next")',
  ])("reports an empty assignment without losing the root: %s", (input) => {
    const result = parse(input, schema);
    expect(result.root?.typeName).toBe("Title");
    expect(result.meta.discarded).toEqual([{ kind: "invalid-statement" }]);
  });

  it("reports an empty assignment when no statement survives", () => {
    const result = parse("unused =", schema);
    expect(result.root).toBeNull();
    expect(result.meta.discarded).toEqual([{ kind: "invalid-statement" }]);
  });

  it("waits for stream completion before reporting a pending empty assignment", () => {
    const parser = createStreamParser(schema);
    const pending = parser.push('root = Title("Shown")\nunused =');
    expect(pending.meta.discarded).toEqual([]);
    expect(parser.getResult(true).meta.discarded).toEqual([{ kind: "invalid-statement" }]);
  });

  it("reports a completed empty assignment before the next streamed statement", () => {
    const parser = createStreamParser(schema);
    const result = parser.push('root = Title("Shown")\nunused =\nnext =');
    expect(result.root?.typeName).toBe("Title");
    expect(result.meta.discarded).toEqual([{ kind: "invalid-statement" }]);
  });

  it("reports discards when no statement survives at all", () => {
    const result = parse('Title("bare")', schema);
    expect(result.root).toBeNull();
    expect(result.meta.discarded).toEqual([{ kind: "invalid-statement" }]);
  });

  it("reports a completed bare call in a stream, but not while it is still pending", () => {
    const parser = createStreamParser(schema);
    parser.push('root = Stack([title])\ntitle = Title("Hello")\n');
    const pending = parser.push('Title("bare")');
    expect(pending.meta.discarded).toEqual([]);
    expect(parser.getResult(true).meta.discarded).toEqual([{ kind: "invalid-statement" }]);
  });

  it("reports a bare call followed by more statements as soon as it completes", () => {
    const parser = createStreamParser(schema);
    const result = parser.push('Title("bare")\nroot = Stack([])\n');
    expect(result.meta.discarded).toEqual([{ kind: "invalid-statement" }]);
  });
});

describe("meta.discarded: trailing-tokens", () => {
  it("reports mixed discarded source without promising diagnostic order", () => {
    const result = parse('root = Title("Shown") Title("extra")\nunused =', schema);
    expect(result.meta.discarded).toHaveLength(2);
    expect(result.meta.discarded).toEqual(
      expect.arrayContaining([
        { kind: "invalid-statement" },
        { kind: "trailing-tokens", statementId: "root" },
      ]),
    );
  });

  it("reports tokens left after a statement's expression on the same line", () => {
    const input = 'root = Stack([title]) Title("extra")\ntitle = Title("Hello")';
    const result = parse(input, schema);
    expect(result.root?.typeName).toBe("Stack");
    expect(result.meta.discarded).toEqual([{ kind: "trailing-tokens", statementId: "root" }]);
  });

  it("reports trailing tokens on a completed streamed statement", () => {
    const results = streamAll('root = Stack([title]) Title("extra")\ntitle = Title("Hello")\n', 4);
    expect(results[results.length - 1].meta.discarded).toEqual([
      { kind: "trailing-tokens", statementId: "root" },
    ]);
  });

  it("forgets earlier discards when the stream is replaced", () => {
    const parser = createStreamParser(schema);
    parser.set('Title("bare")\nroot = Stack([])\n');
    const replaced = parser.set("root = Stack([])\n");
    expect(replaced.meta.discarded).toEqual([]);
  });
});
