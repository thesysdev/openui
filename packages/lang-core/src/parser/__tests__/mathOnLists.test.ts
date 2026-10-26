import { describe, expect, it } from "vitest";
import { evaluate } from "../../runtime/evaluator";
import { parse } from "../parser";
import type { ParamMap } from "../types";

const schema: ParamMap = new Map([["Show", { params: [{ name: "value", required: true }] }]]);
const value = (expr: string) => {
  const result = parse(`root = Show(v)\nv = ${expr}`, schema);
  expect(result.meta.errors).toEqual([]);
  const root = result.root as { props: { value: unknown } };
  const v = root.props.value;
  return v && typeof v === "object" && "k" in (v as object)
    ? evaluate(v as never, { getState: () => null, resolveRef: () => null })
    : v;
};

describe("math built-ins on lists", () => {
  it("applies to each element, keeps null elements, and recurses into nested lists", () => {
    expect(value("@Round([1.26, 2.71, null], 1)")).toEqual([1.3, 2.7, null]);
    expect(value("@Floor([1.9, [2.5, -0.5]])")).toEqual([1, [2, -1]]);
    expect(value("@Ceil([1.1, null])")).toEqual([2, null]);
    expect(value("@Abs([-3, 4.5])")).toEqual([3, 4.5]);
  });
  it("still returns a number for a single value", () => {
    expect(value("@Round(2.345, 2)")).toBe(2.35);
    expect(value("@Abs(-2)")).toBe(2);
  });
  it("rounds a column plucked from rows", () => {
    expect(value("@Round([{a: 1.234}, {a: 5.678}].a, 1)")).toEqual([1.2, 5.7]);
  });
});
