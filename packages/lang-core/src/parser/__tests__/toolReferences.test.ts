import { describe, expect, it } from "vitest";
import { evaluate } from "../../runtime/evaluator";
import { parse } from "../parser";
import type { ParamMap } from "../types";

const schema: ParamMap = new Map([["Title", { params: [{ name: "text", required: true }] }]]);
const ctx = { getState: () => 3, resolveRef: () => ({ value: 7 }) };

describe.each(["Query", "Mutation"])("%s value references", (kind) => {
  function tool(source: string) {
    const result = parse(`root = Title("Healthy")\njob = ${kind}(tool, args)\n${source}`, schema);
    const job = [...result.queryStatements, ...result.mutationStatements].find(
      (stmt) => stmt.statementId === "job",
    )!;
    return { result, job };
  }
  it("resolves forward and chained references in tool names and nested arguments", () => {
    const { result, job } = tool(
      'tool = "save"\nargs = {amount: amount, nested: [alias]}\namount = 42\nalias = amount',
    );
    expect(result.meta.errors).toEqual([]);
    expect(result.meta.orphaned).toEqual([]);
    expect(evaluate(job.toolAST!, ctx)).toBe("save");
    expect(evaluate(job.argsAST!, ctx)).toEqual({ amount: 42, nested: [42] });
  });
  it("resolves function calls and preserves Each iterator scope", () => {
    const { result, job } = tool(
      'tool = "save"\nargs = {total: total, rows: @Each(items, item, item + extra)}\ntotal = @Sum(items)\nitems = [1,2]\nitem = 100\nextra = 10',
    );
    expect(result.meta.errors).toEqual([]);
    expect(evaluate(job.argsAST!, ctx)).toEqual({ total: 3, rows: [11, 12] });
  });
  it("reports unknown functions in a referenced value under its owning statement", () => {
    const { result, job } = tool('tool = "save"\nargs = {amount: amount}\namount = @Missing(42)');
    expect(result.meta.errors).toEqual([
      expect.objectContaining({ code: "unknown-function", statementId: "amount" }),
    ]);
    expect(evaluate(job.argsAST!, ctx)).toEqual({ amount: null });
  });
  it("terminates cycles and unresolved references with null values", () => {
    const { result, job } = tool('tool = "save"\nargs = {cycle:a, missing: absent}\na = b\nb = a');
    expect(result.meta.unresolved).toEqual(expect.arrayContaining(["a", "absent"]));
    expect(evaluate(job.argsAST!, ctx)).toEqual({ cycle: null, missing: null });
  });
  it("preserves references to Query and Mutation results for runtime lookup", () => {
    const { job } = tool(
      'tool = "save"\nargs = {q: q.value, m: m.value}\nq = Query("load")\nm = Mutation("save")',
    );
    expect(evaluate(job.argsAST!, ctx)).toEqual({ q: 7, m: 7 });
  });
});
it("collects state dependencies through value aliases and resolves defaults and refresh", () => {
  const result = parse(
    'root = Title("Healthy")\n$n=2\nq = Query("save", args, defaults, refresh)\nargs={value:alias}\nalias=$n*2\ndefaults={saved:false}\nrefresh=5000',
    schema,
  );
  const q = result.queryStatements[0];
  expect(q.deps).toEqual(["$n"]);
  expect(evaluate(q.argsAST!, ctx)).toEqual({ value: 6 });
  expect(evaluate(q.defaultsAST!, ctx)).toEqual({ saved: false });
  expect(evaluate(q.refreshAST!, ctx)).toBe(5000);
});
