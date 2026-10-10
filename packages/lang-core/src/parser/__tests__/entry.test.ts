import { describe, expect, it } from "vitest";
import { evaluateRoot } from "../../runtime/evaluate-tree";
import { parse } from "../parser";
import type { ParamMap } from "../types";

const schema: ParamMap = new Map([
  ["Card", { params: [{ name: "children", required: true }] }],
  ["Title", { params: [{ name: "text", required: true }] }],
]);

const codes = (result: ReturnType<typeof parse>) => result.meta.errors.map((e) => e.code);

describe("entry rule", () => {
  it("falls back to a first root-component statement, after $state, with a no-root warning", () => {
    const result = parse('$t = 1\npage = Card([t])\nt = Title("x")', schema, "Card");
    expect(result.root).toMatchObject({ typeName: "Card", statementId: "page" });
    expect(result.meta.errors).toMatchObject([{ code: "no-root", severity: "warning" }]);
  });

  it("renders nothing and reports no orphans when there is no entry", () => {
    const result = parse('t = Title("x")\npage = Card([t])', schema, "Card");
    expect(result.root).toBeNull();
    expect(result.meta.orphaned).toEqual([]);
    expect(result.meta.errors).toEqual([expect.objectContaining({ code: "no-root" })]);
    expect(result.meta.errors[0]?.severity).toBeUndefined();
    expect(codes(parse("page = Card([])", schema))).toEqual(["no-root"]);
  });

  it("evaluates a ternary entry at runtime", () => {
    const result = parse('$t = true\nroot = $t ? a : b\na = Title("A")\nb = Title("B")', schema);
    expect(result.meta.errors).toEqual([]);
    const ctx = { getState: () => false, resolveRef: () => undefined };
    const picked = evaluateRoot(result, { ctx, library: { components: {} } as never, store: null });
    expect(picked).toMatchObject({ typeName: "Title", props: { text: "B" } });
  });

  it("reports an unknown @Name call as unknown-function and keeps the statement", () => {
    const result = parse('root = Title("p" + @Foo(1))', schema);
    expect(codes(result)).toEqual(["unknown-function"]);
    expect(result.root?.props.text).toMatchObject({ k: "BinOp", right: { k: "Null" } });
  });
});
