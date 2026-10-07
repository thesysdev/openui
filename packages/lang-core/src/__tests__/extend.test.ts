import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineAction, defineComponent, defineFunction } from "../library";

const comp = (name: string, props: z.ZodObject = z.object({ label: z.string() })) =>
  defineComponent({ name, props, description: `${name} desc`, component: null });
const Text = comp("Text");
const Stack = comp("Stack", z.object({ children: z.array(Text.ref) }));
const parts = {
  components: [Stack, Text],
  componentGroups: [{ name: "Layout", components: ["Stack", "Text"] }],
  root: "Stack",
  id: "base",
};
const base = createLibrary(parts);

describe("library.extend", () => {
  it("adds a component, a function and an action", () => {
    const percent = defineFunction({
      name: "Percent",
      description: "a / b",
      params: z.object({ a: z.number(), b: z.number() }),
      fn: ({ a, b }) => a / b,
    });
    const copy = defineAction({ name: "Copy", description: "copy", params: z.object({}) });
    const lib = base.extend({
      components: { add: [comp("Card")] },
      functions: { add: [percent] },
      actions: { add: [copy] },
    });
    expect(Object.keys(lib.components)).toEqual(["Stack", "Text", "Card"]);
    expect(lib.prompt()).toContain("Card(label: string)");
    expect(lib.prompt()).toContain("@Percent(a: number, b: number)");
    expect(lib.toSpec().actions?.["Copy"]).toBeDefined();
    expect(lib.id).toBeUndefined();
  });

  it("throws when a component name already exists", () => {
    expect(() => base.extend({ components: { add: [comp("Text")] } })).toThrow(
      '[extend] Component "Text" already exists.',
    );
  });

  it("throws on override and remove", () => {
    expect(() => base.extend({ components: { override: [comp("Text")] } })).toThrow(
      "[extend] components.override is not supported yet.",
    );
    expect(() => base.extend({ components: { remove: ["Text"] } })).toThrow(
      "[extend] components.remove is not supported yet.",
    );
    expect(() => base.extend({ functions: { remove: ["Sum"] } })).toThrow(
      "[extend] functions.remove is not supported yet.",
    );
  });

  it("extend({}) matches the base, and the base is untouched", () => {
    const before = base.prompt();
    const lib = base.extend({});
    expect(lib.prompt()).toBe(before);
    expect(lib.toJSONSchema()).toEqual(base.toJSONSchema());
    base.extend({ components: { add: [comp("Card")] } });
    expect(base.prompt()).toBe(before);
    expect(Object.keys(base.components)).toEqual(["Stack", "Text"]);
  });
});
