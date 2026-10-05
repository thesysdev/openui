import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineAction, defineComponent, defineFunction } from "../library";

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
};
const base = createLibrary(parts);
const sig = (lib: { prompt(): string }, name: string) => lib.prompt().match(`\n${name}\\(.*`)?.[0];

describe("library.extend", () => {
  it("adds to the library only, or into named slots, and leaves the base untouched", () => {
    const lib = base.extend({ components: { add: [comp("Card")] } });
    expect(Object.keys(lib.components)).toEqual(["Stack", "Text", "Image", "Frame", "Card"]);
    expect(sig(lib, "Stack")).toContain("children: (Text | Image)[]");
    const slotted = base.extend({
      components: { add: [{ component: comp("Card"), slots: ["Stack"] }] },
    });
    expect(sig(slotted, "Stack")).toContain("children: (Text | Image | Card)[]");
    expect(sig(base, "Stack")).toContain("children: (Text | Image)[]");
  });

  it("fails fast on bad slots, names and unsupported verbs", () => {
    const add = (slots: string[]) =>
      base.extend({ components: { add: [{ component: comp("Card"), slots }] } });
    expect(() => add(["Frame"])).toThrow('"Frame" has no content slot');
    expect(() => add(["Stack.kids"])).toThrow("Candidates: Stack.children.");
    expect(() => base.extend({ components: { add: [comp("Card")], remove: ["Card"] } })).toThrow(
      'Cannot remove "Card": it is added or overridden in the same call.',
    );
    expect(() => base.extend({ components: { add: [comp("Text")] } })).toThrow("already exists");
    expect(() => base.extend({ components: { override: [comp("Card")] } })).toThrow(
      'Cannot override "Card"',
    );
    expect(() => base.extend({ functions: { remove: ["Sum"] } })).toThrow("not supported yet");
  });

  it("rebinds parents to an override and matches createLibrary of the result", () => {
    const lib = base.extend({
      components: { override: [comp("Image", z.object({ src: z.string() }))] },
    });
    const merged = createLibrary({ ...parts, components: Object.values(lib.components) });
    expect(lib.prompt()).toBe(merged.prompt());
    expect(lib.toJSONSchema()).toEqual(merged.toJSONSchema());
  });

  it("removes from unions and groups, guards sole types and the root, warns on stale names", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const lib = base.extend({ components: { remove: ["Frame", "Text"] } });
    expect(sig(lib, "Stack")).toContain("children: (Image)[]");
    expect(lib.componentGroups).toEqual([{ ...parts.componentGroups[0], components: ["Image"] }]);
    expect(warn.mock.calls[0]![0]).toContain("Removed Frame still named");
    const chained = base.extend({ components: { remove: ["Text"] } }).extend({});
    chained.prompt({ examples: ['root = Stack([Text("hi")])'] });
    chained.prompt({ examples: ['root = Stack([Text("hi")])'] });
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
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
    const copy = defineAction({ name: "Copy", description: "", params: z.object({}) });
    const lib = base.extend({ functions: { add: [percent] }, actions: { add: [copy] } });
    expect(lib.functions["Percent"]).toBe(percent);
    expect(lib.actions.Copy).toBe(copy);
    expect(createLibrary({ ...parts, id: "base" }).extend({}).id).toBeUndefined();
    expect(() => lib.extend({ functions: { add: [percent] } })).toThrow('"Percent" collides');
  });
});
