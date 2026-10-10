import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineAction, defineComponent, defineFunction } from "../library";
import { createParser } from "../parser";

const comp = (name: string, props: z.ZodObject = z.object({ label: z.string() })) =>
  defineComponent({ name, props, description: `${name} desc`, component: null });
const Text = comp("Text");
const Image = comp("Image");
const Stack = comp("Stack", z.object({ children: z.array(z.union([Text.ref, Image.ref])) }));
const Frame = comp("Frame", z.object({ image: Image.ref }));
const parts = {
  components: [Stack, Text, Image, Frame],
  componentGroups: [
    { name: "Media", components: ["Image", "Frame"], notes: ["Frame wraps one Image"] },
  ],
  root: "Stack",
  id: "base",
};
const base = createLibrary(parts);
const sig = (lib: { prompt(): string }, name: string) => lib.prompt().match(`\n${name}\\(.*`)?.[0];

describe("library.extend", () => {
  it("adds a component to the library only, and leaves the base untouched", () => {
    const before = base.prompt();
    const lib = base.extend({ components: { add: [comp("Card")] } });
    expect(Object.keys(lib.components)).toEqual(["Stack", "Text", "Image", "Frame", "Card"]);
    expect(sig(lib, "Card")).toContain("Card(label: string)");
    expect(sig(lib, "Stack")).toContain("children: (Text | Image)[]");
    expect(base.prompt()).toBe(before);
  });

  it('adds into a slot by "Parent.prop" or "Parent", and the parser accepts it', () => {
    const program = 'root = Stack([Card("hi")])';
    for (const slot of ["Stack.children", "Stack"]) {
      const lib = base.extend({
        components: { add: [{ component: comp("Card"), slots: [slot] }] },
      });
      expect(sig(lib, "Stack")).toContain("children: (Text | Image | Card)[]");
      const parsed = createParser(lib.toJSONSchema(), "Stack").parse(program);
      expect(parsed.meta.errors).toEqual([]);
      expect(JSON.stringify(parsed.root)).toContain('"typeName":"Card"');
    }
  });

  it("overrides a component and rebinds every parent", () => {
    const lib = base.extend({
      components: { override: [comp("Image", z.object({ src: z.string() }))] },
    });
    const merged = createLibrary({ ...parts, components: Object.values(lib.components) });
    expect(lib.prompt()).toBe(merged.prompt());
    expect(lib.toJSONSchema()).toEqual(merged.toJSONSchema());
  });

  it("removes from unions and groups, and warns once on names still in notes", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const lib = base.extend({ components: { remove: ["Frame", "Text"] } });
    expect(sig(lib, "Stack")).toContain("children: (Image)[]");
    expect(lib.componentGroups).toEqual([{ ...parts.componentGroups[0], components: ["Image"] }]);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]![0]).toContain("Removed Frame still named");
    warn.mockRestore();
  });

  it("slots a component that nests its new parent: Card(body: Stack) into Stack", () => {
    const Card = comp("Card", z.object({ body: Stack.ref }));
    const lib = base.extend({ components: { add: [{ component: Card, slots: ["Stack"] }] } });
    const schema = lib.toJSONSchema();
    const parsed = createParser(schema, "Stack").parse('root = Stack([Card(Stack([Text("x")]))])');
    expect(parsed.meta.errors).toEqual([]);
    expect(Object.keys(schema.$defs!).sort()).toEqual(["Card", "Frame", "Image", "Stack", "Text"]);
    expect(schema.$defs!.Card).toMatchObject({ properties: { body: { $ref: "#/$defs/Stack" } } });
  });

  it("rebinds a self-recursive component to itself", () => {
    const Tree: any = comp(
      "Tree",
      z.object({
        get children(): z.ZodArray {
          return z.array(z.union([Tree.ref, Text.ref]));
        },
      }),
    );
    const lib = createLibrary({ components: [Tree, Text], root: "Tree" }).extend({
      components: { override: [comp("Text", z.object({ value: z.string() }))] },
    });
    const schema = lib.toJSONSchema();
    expect(Object.keys(schema.$defs!).sort()).toEqual(["Text", "Tree"]);
    const items = { anyOf: [{ $ref: "#/$defs/Tree" }, { $ref: "#/$defs/Text" }] };
    expect(schema.$defs!.Tree).toMatchObject({ properties: { children: { items } } });
    expect(schema.$defs!.Text).toMatchObject({ properties: { value: { type: "string" } } });
  });

  it("replaces every member of a slot in one call", () => {
    const lib = base.extend({
      components: {
        remove: ["Text", "Image", "Frame"],
        add: [{ component: comp("Card"), slots: ["Stack"] }],
      },
    });
    expect(sig(lib, "Stack")).toContain("children: (Card)[]");
  });

  it("adds once when two slots name the same prop", () => {
    const lib = base.extend({
      components: { add: [{ component: comp("Card"), slots: ["Stack.children", "Stack"] }] },
    });
    expect(sig(lib, "Stack")).toContain("children: (Text | Image | Card)[]");
  });

  it("fails fast on bad slots and names", () => {
    const add = (slots: string[]) =>
      base.extend({ components: { add: [{ component: comp("Card"), slots }] } });
    expect(() => add(["Frame"])).toThrow('"Frame" has no content slot');
    expect(() => add(["Stack.kids"])).toThrow("Candidates: Stack.children.");
    expect(() => base.extend({ components: { add: [comp("Text")] } })).toThrow("already exists");
    expect(() => base.extend({ components: { override: [comp("Card")] } })).toThrow(
      'Cannot override "Card"',
    );
    expect(() => base.extend({ components: { add: [comp("Card")], remove: ["Card"] } })).toThrow(
      "added or overridden in the same call",
    );
    expect(() => base.extend({ components: { remove: ["Image"] } })).toThrow("only type allowed");
    expect(() => base.extend({ components: { remove: ["Stack"] } })).toThrow("library root");
  });

  it("adds functions and actions; a derived library has no id", () => {
    const percent = defineFunction({
      name: "Percent",
      description: "a / b",
      params: z.object({ a: z.number(), b: z.number() }),
      fn: ({ a, b }) => a / b,
    });
    const copy = defineAction({ name: "Copy", description: "copy", params: z.object({}) });
    const lib = base.extend({ functions: { add: [percent] }, actions: { add: [copy] } });
    expect(lib.prompt()).toContain("@Percent(a: number, b: number)");
    expect(lib.actions.Copy).toBe(copy);
    expect(lib.id).toBeUndefined();
    expect(() => lib.extend({ functions: { add: [percent] } })).toThrow('"Percent" collides');
  });
});
