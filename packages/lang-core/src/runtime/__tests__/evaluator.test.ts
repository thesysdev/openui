import { describe, expect, it } from "vitest";
import type { ASTNode } from "../../parser/ast";
import { evaluate } from "../evaluator";

const ref = (n: string): ASTNode => ({ k: "Ref", n });
const member = (obj: ASTNode, field: string): ASTNode => ({ k: "Member", obj, field });
const comp = (name: string, ...args: ASTNode[]): ASTNode => ({ k: "Comp", name, args });

describe("Each loop variable", () => {
  it("captures row fields in deferred Set steps and keeps member semantics", () => {
    const rows = [{ id: 1, meta: { tag: "x" }, u: undefined }];
    const r = ref("r");
    const template = comp("Action", {
      k: "Arr",
      els: [
        comp("Set", { k: "StateRef", n: "$a" }, member(r, "id")),
        comp("Set", { k: "StateRef", n: "$b" }, member(member(r, "meta"), "tag")),
        comp("Set", { k: "StateRef", n: "$c" }, member(r, "u")),
        comp("Set", { k: "StateRef", n: "$d" }, member(r, "missing")),
      ],
    });
    const each = comp("Each", ref("rows"), { k: "Str", v: "r" }, template);
    const ctx = { getState: () => null, resolveRef: (n: string) => (n === "rows" ? rows : null) };
    const [plan] = evaluate(each, ctx) as Array<{ steps: Array<{ valueAST: ASTNode }> }>;
    expect(plan.steps.map((s) => s.valueAST)).toEqual([
      { k: "Num", v: 1 },
      { k: "Str", v: "x" },
      { k: "Null" },
      member(
        {
          k: "Obj",
          entries: [
            ["id", { k: "Num", v: 1 }],
            ["meta", { k: "Obj", entries: [["tag", { k: "Str", v: "x" }]] }],
            ["u", { k: "Null" }],
          ],
        },
        "missing",
      ),
    ]);
  });
});
