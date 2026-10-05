import { expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent } from "../../library";
import { createParser } from "../../parser";
import { evaluateElementProps } from "../evaluate-tree";

const Button = defineComponent({
  name: "Button",
  props: z.object({ label: z.string(), action: z.any().optional() }),
  description: "",
  component: null as any,
});
const library = createLibrary({ root: "Button", components: [Button] });
const parser = createParser(library.toJSONSchema(), "Button");

function contextOf(args: string): unknown {
  const { root } = parser.parse(`root = Button("Go", Action([@ToAssistant(${args})]))`);
  const ctx = { getState: () => undefined, resolveRef: () => null };
  return evaluateElementProps(root!, { ctx, library, store: null }).props.action.steps[0].context;
}

it("passes any @ToAssistant context through; null or missing means none", () => {
  expect(contextOf(`"Save", { ticket: "T-42" }`)).toEqual({ ticket: "T-42" });
  expect(contextOf(`"Save", 0`)).toBe(0);
  expect(contextOf(`"Save", null`)).toBeUndefined();
  expect(contextOf(`"Save"`)).toBeUndefined();
});
