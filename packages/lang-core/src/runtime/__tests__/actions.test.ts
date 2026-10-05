import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent, tagSchemaId } from "../../library";
import { createParser } from "../../parser";
import { evaluateElementProps } from "../evaluate-tree";

const actionExpression = z.any();
tagSchemaId(actionExpression, "ActionExpression");
const Button = defineComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    action: actionExpression.optional(),
    data: z.any().optional(),
  }),
  description: "",
  component: null as any,
});
const library = createLibrary({ root: "Button", components: [Button] });
const parser = createParser(library.toJSONSchema(), "Button");

function propsOf(action: string, data = "null", preamble = ""): any {
  const { root } = parser.parse(`root = Button("Go", ${action}, ${data})\n${preamble}`);
  const ctx = { getState: () => undefined, resolveRef: () => null };
  return evaluateElementProps(root!, { ctx, library, store: null }).props;
}
const actionOf = (action: string, preamble?: string) => propsOf(action, "null", preamble).action;
const typesOf = (action: string, preamble?: string) =>
  actionOf(action, preamble).steps.map((s: { type: string }) => s.type);

describe("action plans", () => {
  it("evaluates a bare step to a one-step plan", () => {
    expect(actionOf(`@OpenUrl("u")`)).toEqual({ steps: [{ type: "open_url", url: "u" }] });
    expect(actionOf(`@Run(q)`, `q = Query("tool", {}, {})`)).toEqual({
      steps: [{ type: "run", statementId: "q", refType: "query" }],
    });
  });

  it("evaluates a list of steps to one plan and leaves other lists as data", () => {
    expect(typesOf(`[@Set($a, 1), @ToAssistant("Saved")]`)).toEqual([
      "set",
      "continue_conversation",
    ]);
    expect(typesOf(`steps`, `steps = [@OpenUrl("u"), @Reset($a)]`)).toEqual(["open_url", "reset"]);
    expect(propsOf("null", `[]`).data).toEqual([]);
    expect(propsOf("null", `[1, @OpenUrl("u")]`).data).toHaveLength(2);
  });

  it("keeps data lists whose items have steps as data", () => {
    const rows = `[{name: "Pasta", steps: ["boil", "drain"]}, {name: "Rice", steps: ["rinse"]}]`;
    expect(propsOf("null", rows).data).toEqual([
      { name: "Pasta", steps: ["boil", "drain"] },
      { name: "Rice", steps: ["rinse"] },
    ]);
    expect(propsOf("null", "rows", `rows = ${rows}`).data).toHaveLength(2);
  });

  it("flattens nested Action([...]) plans and drops invalid steps", () => {
    expect(typesOf(`Action([@Set($a, 1), Action([@OpenUrl("u")])])`)).toEqual(["set", "open_url"]);
    expect(actionOf(`@Set("a", 1)`)).toEqual({ steps: [] });
    expect(typesOf(`[@Reset("a"), @OpenUrl("u")]`)).toEqual(["open_url"]);
    expect(typesOf(`[$f ? @Set($a, 1) : null, @OpenUrl("u")]`)).toEqual(["open_url"]);
  });

  it("leaves legacy action configs unchanged", () => {
    expect(actionOf(`{type: "open_url", url: "u"}`)).toEqual({ type: "open_url", url: "u" });
  });

  it("passes any @ToAssistant context through; null or missing means none", () => {
    const contextOf = (args: string) => actionOf(`@ToAssistant(${args})`).steps[0].context;
    expect(contextOf(`"Save", { ticket: "T-42" }`)).toEqual({ ticket: "T-42" });
    expect(contextOf(`"Save", 0`)).toBe(0);
    expect(contextOf(`"Save", null`)).toBeUndefined();
    expect(contextOf(`"Save"`)).toBeUndefined();
  });
});
