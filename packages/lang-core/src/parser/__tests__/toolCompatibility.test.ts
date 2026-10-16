import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent, defineFunction } from "../../library";
import { evaluate } from "../../runtime/evaluator";
import { createParser } from "../parser";

const Text = defineComponent({
  name: "Text",
  description: "Shows a value",
  props: z.object({ value: z.any() }),
  component: null,
});

describe.each(["Query", "Mutation"])("%s expression compatibility", (kind) => {
  it.each([
    ["@Format(25)", "25:default", []],
    ["@Format(25, null)", "25:default", []],
    ['@Format(25, "label")', "25:label", []],
    ["@Format(25, 10)", "25:default", ["type-mismatch"]],
    ['@Format("bad")', null, ["type-mismatch"]],
    ["@Format()", null, ["missing-required"]],
    ["@Format(null)", null, ["null-required"]],
    ['@Format(25, "label", 3)', "25:label", ["excess-args"]],
    ["@Format($n)", "2:default", []],
    ["@Each([1, 2], x, @Format(x))", ["1:default", "2:default"], []],
    [
      "@Each([1, 2], x, @Each([3, 4], y, x + y))",
      [
        [4, 5],
        [5, 6],
      ],
      [],
    ],
    ["false ? @Format(99) : 42", 42, []],
  ])("preserves %s", (expression, expected, codes) => {
    const format = defineFunction({
      name: "Format",
      description: "Formats a value",
      params: z.object({ value: z.number(), label: z.string().default("default") }),
      returns: z.string(),
      fn: vi.fn(({ value, label }: { value: number; label: string }) => `${value}:${label}`),
    });
    const library = createLibrary({ root: "Text", components: [Text], functions: [format] });
    const schema = library.toJSONSchema();
    const result = createParser(schema, "Text").parse(
      `root = Text("Healthy")\njob = ${kind}("save", {value: ${expression}})`,
    );
    const job = [...result.queryStatements, ...result.mutationStatements][0]!;
    // Normalization validates and names expressions; it must not run library functions.
    expect(format.fn).not.toHaveBeenCalled();
    expect(result.meta.errors.map((error) => error.code)).toEqual(codes);
    expect(result.meta.errors.every((error) => error.statementId === "job")).toBe(true);
    expect(
      evaluate(job.argsAST!, {
        getState: () => 2,
        resolveRef: () => undefined,
        functions: { Format: { ...schema.functions!.Format!, fn: format.fn } },
      }),
    ).toEqual({ value: expected });
    if (expected === null || expression.startsWith("false")) {
      expect(format.fn).not.toHaveBeenCalled();
    }
  });

  it("keeps Set, Reset and Run as action data without performing state writes or tools", () => {
    const library = createLibrary({ root: "Text", components: [Text] });
    const result = createParser(library.toJSONSchema(), "Text").parse(
      `root = Text("Healthy")\njob = ${kind}("save", {plan: Action([@Set($n, $n + 1), @Reset($n), @Run(q)])})\nq = Query("load")`,
    );
    const job = [...result.queryStatements, ...result.mutationStatements].find(
      (statement) => statement.statementId === "job",
    )!;
    const resolveRef = vi.fn();
    const args = evaluate(job.argsAST!, { getState: () => 2, resolveRef });
    expect(args).toMatchObject({
      plan: {
        steps: [
          { type: "set", target: "$n" },
          { type: "reset" },
          { type: "run", statementId: "q", refType: "query" },
        ],
      },
    });
    expect(resolveRef).not.toHaveBeenCalled();
  });
});
