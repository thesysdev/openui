import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent } from "../../library";
import { createParser } from "../../parser";
import { action } from "../../parser/builtins";
import { evaluateElementProps } from "../evaluate-tree";

const Button = defineComponent({
  name: "Button",
  props: z.object({ label: z.string(), action: action().optional() }),
  description: "",
  component: null as any,
});
const library = createLibrary({ root: "Button", components: [Button] });
const parser = createParser(library.toJSONSchema(), "Button");

function actionOf(action: string): any {
  const { root } = parser.parse(`root = Button("Go", ${action})`);
  const ctx = { getState: () => undefined, resolveRef: () => null };
  return evaluateElementProps(root!, { ctx, library, store: null }).props.action;
}

describe("action plans", () => {
  it("evaluates a bare step to a one-step plan", () => {
    expect(actionOf(`@OpenUrl("u")`)).toEqual({ steps: [{ type: "open_url", url: "u" }] });
  });

  it("flattens nested Action([...]) plans and drops invalid steps", () => {
    const { steps } = actionOf(`Action([@Set($a, 1), @Reset("a"), Action([@OpenUrl("u")])])`);
    expect(steps.map((s: { type: string }) => s.type)).toEqual(["set", "open_url"]);
  });

  it("passes any @ToAssistant context through; null means none", () => {
    expect(actionOf(`@ToAssistant("Save", {ticket: "T-42"})`).steps[0].context).toEqual({
      ticket: "T-42",
    });
    expect(actionOf(`@ToAssistant("Save", null)`).steps[0].context).toBeUndefined();
  });
});
