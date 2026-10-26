import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { defineFunction } from "../../functions";
import { createLibrary, defineComponent } from "../../library";
import { compileSchema, parse } from "../parser";
import type { ParamMap } from "../types";

const schema = new Map([["Show", { params: [{ name: "value", required: true }] }]]) as ParamMap;
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
  it("evaluates expressions nested in list and object defaults", () => {
    expect(defaults('$rows = [{price: 10 * 2}, 1 + 2]\n$cfg = {t: 3 * 3, label: "x"}')).toEqual({
      $rows: [{ price: 20 }, 3],
      $cfg: { t: 9, label: "x" },
    });
  });
  it("keeps a default that calls a library function or an action as written", () => {
    const library = createLibrary({
      root: "Show",
      components: [
        defineComponent({
          name: "Show",
          description: "",
          props: z.object({ value: z.any() }),
          component: null,
        }),
      ],
      functions: [
        defineFunction({
          name: "Percent",
          description: "",
          params: z.object({ a: z.number(), b: z.number() }),
          returns: z.number(),
          fn: ({ a, b }) => (a / b) * 100,
        }),
      ],
    });
    const d = parse(
      "root = Show(1)\n$p = @Percent(1, 2)\n$s = @Set($x, 1)",
      compileSchema(library.toJSONSchema()),
    ).stateDeclarations as Record<string, { k?: string; name?: string }>;
    expect([d.$p?.k, d.$p?.name]).toEqual(["Comp", "Percent"]);
    expect([d.$s?.k, d.$s?.name]).toEqual(["Comp", "Set"]);
  });
});
