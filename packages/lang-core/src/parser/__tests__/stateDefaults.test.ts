import { describe, expect, it } from "vitest";
import { parse } from "../parser";
import type { ParamMap } from "../types";

const schema: ParamMap = new Map([["Show", { params: [{ name: "value", required: true }] }]]);
const defaults = (source: string) => parse(`root = Show(1)\n${source}`, schema).stateDeclarations;

describe("state defaults", () => {
  it("evaluates an expression default once to a plain value", () => {
    expect(defaults('$total = 1 + 2\n$label = "n=" + 3\n$list = @Sort([3, 1, 2], "")')).toEqual({
      $total: 3,
      $label: "n=3",
      $list: [1, 2, 3],
    });
  });
  it("reads states declared before it, and null for later states and queries", () => {
    expect(
      defaults(
        '$price = 10\n$tax = $price * 2\n$early = $late + 1\n$late = 5\nq = Query("t", {}, 7)\n$fromQuery = q',
      ),
    ).toEqual({ $price: 10, $tax: 20, $early: 1, $late: 5, $fromQuery: null });
  });
  it("keeps literal defaults unchanged", () => {
    expect(defaults('$a = "x"\n$b = [1, {k: true}]\n$c = null')).toEqual({
      $a: "x",
      $b: [1, { k: true }],
      $c: null,
    });
  });
});
