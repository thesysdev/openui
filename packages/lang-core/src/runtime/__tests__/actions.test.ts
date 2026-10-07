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
  }),
  description: "",
  component: null as any,
});
const library = createLibrary({ root: "Button", components: [Button] });
const parser = createParser(library.toJSONSchema(), "Button");

function actionOf(action: string, preamble = ""): any {
  const { root } = parser.parse(`root = Button("Go", ${action})\n${preamble}`);
  const ctx = { getState: () => undefined, resolveRef: () => null };
  return evaluateElementProps(root!, { ctx, library, store: null }).props.action;
}
const typesOf = (action: string, preamble?: string) =>
  actionOf(action, preamble).steps.map((s: { type: string }) => s.type);

describe("action plans", () => {
  it("evaluates a bare step to a one-step plan", () => {
    expect(actionOf(`@OpenUrl("u")`)).toEqual({ steps: [{ type: "open_url", url: "u" }] });
    expect(actionOf(`@Run(q)`, `q = Query("tool", {}, {})`)).toEqual({
      steps: [{ type: "run", statementId: "q", refType: "query" }],
    });
  });

  it("flattens nested Action([...]) plans and drops invalid steps", () => {
    expect(typesOf(`Action([@Set($a, 1), Action([@OpenUrl("u")])])`)).toEqual(["set", "open_url"]);
    expect(actionOf(`@Set("a", 1)`)).toEqual({ steps: [] });
    expect(typesOf(`Action([@Reset("a"), @OpenUrl("u")])`)).toEqual(["open_url"]);
    expect(typesOf(`Action([$f ? @Set($a, 1) : null, @OpenUrl("u")])`)).toEqual(["open_url"]);
    expect(actionOf(`[@OpenUrl("u")]`)).toEqual([{ steps: [{ type: "open_url", url: "u" }] }]);
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
