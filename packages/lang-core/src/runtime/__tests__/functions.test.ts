import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent, defineFunction } from "../../library";
import { parseExpression } from "../../parser/expressions";
import { tokenize } from "../../parser/lexer";
import { createParser, createStreamingParser } from "../../parser/parser";
import type { ElementNode, OpenUIError } from "../../parser/types";
import { evaluateElementProps } from "../evaluate-tree";
import { evaluate } from "../evaluator";

const Text = defineComponent({
  name: "Text",
  props: z.object({ value: z.any() }),
  description: "Shows a value",
  component: null,
});
const fns = [
  defineFunction({
    name: "Percent",
    description: "Formats part / total as a percentage",
    params: z.object({ part: z.number(), total: z.number().default(100) }),
    returns: z.string(),
    fn: ({ part, total }) => `${((part / total) * 100).toFixed(1)}%`,
  }),
  defineFunction({
    name: "Sum2",
    description: "Sums numbers, with an optional label",
    params: z.object({ numbers: z.array(z.number()), label: z.string().optional() }),
    fn: ({ numbers, label }) => `${label ?? ""}${numbers.reduce((a, b) => a + b, 0)}`,
  }),
];
const lib = createLibrary({ root: "Text", components: [Text], functions: fns });
const schema = lib.toJSONSchema();
const functions = Object.fromEntries(
  Object.entries(schema.functions!).map(([name, s]) => [
    name,
    { ...s, fn: lib.functions[name]!.fn },
  ]),
);

function evalRoot(root: ElementNode, state: Record<string, unknown> = {}) {
  const errors: OpenUIError[] = [];
  const ctx = {
    getState: (n: string) => state[n],
    resolveRef: () => undefined,
    functions,
  };
  const evaluated = evaluateElementProps(root, { ctx, library: lib, store: null, errors });
  return { value: evaluated.props["value"], errors: errors.map((e) => e.message) };
}

function run(source: string, state?: Record<string, unknown>) {
  const result = createParser(schema, "Text").parse(`root = Text(${source})`);
  return { ...evalRoot(result.root!, state), parseErrors: result.meta.errors.map((e) => e.code) };
}

describe("library functions", () => {
  it("are described in toSpec and toJSONSchema", () => {
    expect(lib.toSpec().functions!["Percent"]).toEqual({
      signature: "Percent(part: number, total?: number) → string",
      description: "Formats part / total as a percentage",
    });
    expect(Object.keys(schema.functions!["Percent"]!.params.properties!)).toEqual([
      "part",
      "total",
    ]);
  });

  it("map args by name, validate literals at parse time, apply defaults", () => {
    expect(run("@Percent(1, 4)")).toEqual({ value: "25.0%", errors: [], parseErrors: [] });
    expect(run("@Percent(25)").value).toBe("25.0%");
    expect(run('@Percent("1", 4)')).toMatchObject({ value: null, parseErrors: ["type-mismatch"] });
    expect(run("@Sum2([1, 2], 3, 4)")).toMatchObject({
      value: "3",
      parseErrors: ["excess-args", "type-mismatch"],
    });
    expect(run("@Sum2([1], null)").value).toBe("1");
  });

  it("validate dynamic args at runtime without touching the data", () => {
    const state = { $n: [1, "x", 2] };
    expect(run("@Sum2($n)", state)).toMatchObject({ value: "3", parseErrors: [] });
    expect(state.$n).toEqual([1, "x", 2]);
    expect(run("@Percent($p)", { $p: "1" }).errors).toEqual([
      'Evaluating prop "value" on Text failed: @Percent: field "/part" expects number but got string',
    ]);
    // A required arg not set yet (or a query still loading) gives null without an error
    expect(run("@Percent($p)", {})).toMatchObject({ value: null, errors: [] });
  });

  it("run on every streamed chunk", () => {
    const stream = createStreamingParser(schema, "Text");
    expect(evalRoot(stream.push("root = Text(@Percent(1").root!).value).toBe("1.0%");
    expect(evalRoot(stream.push("2, 4))").root!).value).toBe("300.0%");
  });

  it("take positional args from an AST made by parseExpression() alone", () => {
    const ctx = { getState: () => undefined, resolveRef: () => null, functions };
    const evalSource = (src: string) => evaluate(parseExpression(tokenize(src)), ctx);
    expect(evalSource("@Sum([1, 2, 3])")).toBe(6);
    expect(evalSource("@Percent(1, 4)")).toBe("25.0%");
  });

  it("reject a name taken by a built-in or a component", () => {
    for (const name of ["Sum", "Text"]) {
      const fn = defineFunction({ name, description: "", params: z.object({}), fn: () => 1 });
      expect(() => createLibrary({ components: [Text], functions: [fn] })).toThrow("collides");
    }
  });

  it("are listed in the prompt with the generated built-in lines", () => {
    const line = "@Percent(part: number, total?: number) → string — Formats part / total";
    const plain = createLibrary({ root: "Text", components: [Text] });
    expect(lib.prompt({ toolCalls: true })).toContain(
      "@Sum(numbers: number[]) → number — Sum of numeric array",
    );
    expect(lib.prompt()).toContain(`## Built-in Functions\n\n${line}`);
    expect(plain.prompt({ toolCalls: true })).not.toContain("@Percent");
    expect(plain.prompt({ toolCalls: true, builtinFunctions: false })).not.toContain(
      "## Built-in Functions",
    );
  });
});
