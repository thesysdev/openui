import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent, tagSchemaId, type Library } from "../library";
import { createParser } from "../parser";
import { action, steps } from "../parser/builtins";
import { generateSystemPrompt, type LibrarySpec } from "../parser/prompt";
import { calculateSystemPromptConfigHash } from "../telemetry/runtime";

const Dummy = null as any;

describe("component property descriptions", () => {
  it("includes property guidance in the local config hash with stable key ordering", async () => {
    const spec = (propDescriptions: Record<string, string>): LibrarySpec => ({
      components: { Card: { signature: "Card(title: string, note: string)", propDescriptions } },
    });
    const original = await calculateSystemPromptConfigHash(
      spec({ title: "Title.", note: "Note." }),
    );
    const reordered = await calculateSystemPromptConfigHash(
      spec({ note: "Note.", title: "Title." }),
    );
    const changed = await calculateSystemPromptConfigHash(
      spec({ title: "Heading.", note: "Note." }),
    );

    expect(reordered).toBe(original);
    expect(changed).not.toBe(original);
  });

  it.each([false, true])("includes property descriptions with groups=%s", (grouped) => {
    const SpecialCard = defineComponent({
      name: "SpecialCard",
      description: "A special card.",
      props: z.object({
        myProp: z.string().describe("Use this property for the headline."),
        subtitle: z.string().optional().describe("An optional subtitle."),
        count: z.number(),
      }),
      component: Dummy,
    });
    const lib = createLibrary({
      components: [SpecialCard],
      componentGroups: grouped ? [{ name: "Cards", components: ["SpecialCard"] }] : undefined,
    });

    expect(lib.prompt()).toContain(
      "SpecialCard(myProp: string, subtitle?: string, count: number) — A special card.\n" +
        "  - myProp: Use this property for the headline.\n" +
        "  - subtitle: An optional subtitle.",
    );
    expect(lib.toSpec().components.SpecialCard?.signature).toBe(
      "SpecialCard(myProp: string, subtitle?: string, count: number)",
    );
    expect(lib.toSpec().components.SpecialCard?.description).toBe("A special card.");
    const serialized = JSON.parse(JSON.stringify(lib.toSpec())) as LibrarySpec;
    expect(generateSystemPrompt({ library: serialized })).toBe(lib.prompt());
  });

  it("finds descriptions inside wrappers and prefers outer descriptions", () => {
    const Card = defineComponent({
      name: "Card",
      description: "A card.",
      props: z.object({
        title: z.string().describe("Card title.").optional(),
        count: z.number().describe("Item count.").default(0),
        note: z.string().describe("Card note.").nullable().optional(),
        label: z.string().describe("Inner label.").optional().describe("Outer label."),
      }),
      component: Dummy,
    });
    const prompt = createLibrary({ components: [Card] }).prompt();

    expect(prompt).toContain("  - title: Card title.");
    expect(prompt).toContain("  - count: Item count.");
    expect(prompt).toContain("  - note: Card note.");
    expect(prompt).toContain("  - label: Outer label.");
    expect(prompt).not.toContain("Inner label.");
  });

  it("leaves components without property descriptions unchanged", () => {
    const Card = defineComponent({
      name: "Card",
      description: "A card.",
      props: z.object({ title: z.string() }),
      component: Dummy,
    });

    const lib = createLibrary({ components: [Card] });
    expect(lib.toSpec().components.Card).toEqual({
      signature: "Card(title: string)",
      description: "A card.",
    });
    expect(lib.prompt()).toContain("Card(title: string) — A card.\n\n");
  });

  it("indents multiline prop guidance when the component description is empty", () => {
    const Card = defineComponent({
      name: "Card",
      description: "",
      props: z.object({ title: z.string().describe("Card title.\nKeep it short.") }),
      component: Dummy,
    });

    expect(createLibrary({ components: [Card] }).prompt()).toContain(
      "Card(title: string)\n  - title: Card title.\n    Keep it short.",
    );
  });
});

// ─── tagSchemaId + registry integration ─────────────────────────────────────

describe("tagSchemaId", () => {
  it("action slots are ActionExpression or restricted @Name refs, $refs in JSON", () => {
    const Button = defineComponent({
      name: "Button",
      props: z.object({
        label: z.string(),
        action: action().optional(),
        share: z.union([steps.ToAssistant.ref, steps.OpenUrl.ref]).optional(),
      }),
      description: "A button",
      component: Dummy,
    });

    const lib = createLibrary({ components: [Button], root: "Button" });
    const prompt = lib.prompt();

    expect(prompt).toContain("action?: ActionExpression, share?: @ToAssistant | @OpenUrl)");
    expect(prompt).toContain("Put several steps in Action([...])");
    const schema = lib.toJSONSchema();
    expect(schema.$defs?.Button.properties?.action).toEqual({ $ref: "#/$defs/ActionExpression" });
    // A legacy object in an action slot is data, not a component: no type-mismatch
    const parsed = createParser(schema, "Button").parse(
      'root = Button("x", {type: "continue_conversation", context: "x"})',
    );
    expect(parsed.meta.errors).toEqual([]);
  });

  it("tagged schema inside array is discovered", () => {
    const itemSchema = z.object({ text: z.string() });
    tagSchemaId(itemSchema, "ListItem");

    const List = defineComponent({
      name: "List",
      props: z.object({ items: z.array(itemSchema) }),
      description: "A list",
      component: Dummy,
    });

    const lib = createLibrary({ components: [List], root: "List" });
    const prompt = lib.prompt();

    expect(prompt).toContain("items: ListItem[]");
  });

  it("tagged schema inside union is discovered", () => {
    const textSchema = z.object({ text: z.string() });
    tagSchemaId(textSchema, "TextNode");

    const imgSchema = z.object({ src: z.string() });
    tagSchemaId(imgSchema, "ImageNode");

    const Card = defineComponent({
      name: "Card",
      props: z.object({ child: z.union([textSchema, imgSchema]) }),
      description: "A card",
      component: Dummy,
    });

    const lib = createLibrary({ components: [Card], root: "Card" });
    const prompt = lib.prompt();

    expect(prompt).toContain("TextNode | ImageNode");
  });

  it("tagged schema inside optional wrapper is discovered", () => {
    const actionSchema = z.any();
    tagSchemaId(actionSchema, "MyAction");

    const Btn = defineComponent({
      name: "Btn",
      props: z.object({ action: actionSchema.optional() }),
      description: "btn",
      component: Dummy,
    });

    const lib = createLibrary({ components: [Btn], root: "Btn" });
    const prompt = lib.prompt();

    expect(prompt).toContain("action?: MyAction");
  });
});

// ─── per-library registry isolation ─────────────────────────────────────────

describe("per-library registry", () => {
  it("two libraries with same component name do not collide", () => {
    const ButtonA = defineComponent({
      name: "Button",
      props: z.object({ label: z.string() }),
      description: "Button A",
      component: Dummy,
    });

    const ButtonB = defineComponent({
      name: "Button",
      props: z.object({ text: z.string() }),
      description: "Button B",
      component: Dummy,
    });

    // Both should create without throwing
    const libA = createLibrary({ components: [ButtonA], root: "Button" });
    const libB = createLibrary({ components: [ButtonB], root: "Button" });

    expect(libA.prompt()).toContain("label: string");
    expect(libB.prompt()).toContain("text: string");
  });

  it("toJSONSchema produces $defs with $ref pointers", () => {
    const Text = defineComponent({
      name: "TextContent",
      props: z.object({ text: z.string() }),
      description: "text",
      component: Dummy,
    });

    const Card = defineComponent({
      name: "Card",
      props: z.object({
        title: z.string(),
        children: z.array(z.union([Text.ref])),
      }),
      description: "card",
      component: Dummy,
    });

    const lib = createLibrary({ components: [Text, Card], root: "Card" });
    const schema = lib.toJSONSchema() as Record<string, any>;

    // $defs contain all component schemas
    expect(schema.$defs).toBeDefined();
    expect(schema.$defs["TextContent"].properties?.text).toBeDefined();
    expect(schema.$defs["Card"].properties?.title).toBeDefined();

    // $refs inside $defs use #/$defs/ format
    const childrenItems = schema.$defs["Card"].properties?.children?.items;
    const refs = JSON.stringify(childrenItems);
    expect(refs).toContain("#/$defs/TextContent");
  });

  it("toSpec carries the library JSON schema alongside signatures", () => {
    const Text = defineComponent({
      name: "TextContent",
      props: z.object({ text: z.string() }),
      description: "text",
      component: Dummy,
    });

    const Card = defineComponent({
      name: "Card",
      props: z.object({ title: z.string() }),
      description: "card",
      component: Dummy,
    });

    const lib = createLibrary({
      components: [Text, Card],
      componentGroups: [{ name: "Content", components: ["TextContent"] }],
      root: "Card",
    });
    const spec = lib.toSpec();

    // Spec is self-contained: signatures + groups + the parser schema.
    expect(spec.root).toBe("Card");
    expect(spec.components["Card"]?.signature).toContain("title");
    expect(spec.componentGroups).toEqual([{ name: "Content", components: ["TextContent"] }]);
    expect((spec as LibrarySpec).schema).toEqual(lib.toJSONSchema());
  });

  it("toSpec carries the createLibrary id, omitted when unset", () => {
    const Text = defineComponent({
      name: "TextContent",
      props: z.object({ text: z.string() }),
      description: "text",
      component: Dummy,
    });

    const named = createLibrary({
      components: [Text],
      root: "TextContent",
      id: "acme-support@3",
    });
    expect(named.id).toBe("acme-support@3");
    expect(named.toSpec().id).toBe("acme-support@3");
    expect(named.__libraryId).toEqual(expect.any(String));
    expect(named.__libraryId).not.toBe("acme-support@3");

    const anonymous = createLibrary({ components: [Text], root: "TextContent" });
    expect(anonymous.id).toBeUndefined();
    expect("id" in anonymous.toSpec()).toBe(false);
    expect(anonymous.__libraryId).toEqual(expect.any(String));
    expect(anonymous.__libraryId).not.toBe(named.__libraryId);
  });

  it("toJSONSchema carries defineComponent descriptions on $defs entries", () => {
    const Text = defineComponent({
      name: "TextContent",
      props: z.object({ text: z.string() }),
      description: "Plain text content",
      component: Dummy,
    });

    const lib = createLibrary({ components: [Text], root: "TextContent" });
    const schema = lib.toJSONSchema();

    expect(schema.$defs?.["TextContent"]?.description).toBe("Plain text content");
  });
});

// ─── getSchemaId WeakMap fallback ────────────────────────────────────────────

describe("getSchemaId fallback", () => {
  it("component .ref resolves name even when not in this library", () => {
    // TextContent is defined but NOT passed to createLibrary
    const TextContent = defineComponent({
      name: "TextContent",
      props: z.object({ text: z.string() }),
      description: "text",
      component: Dummy,
    });

    // Card references TextContent.ref in its children
    const Card = defineComponent({
      name: "Card",
      props: z.object({ children: z.array(z.union([TextContent.ref])) }),
      description: "card",
      component: Dummy,
    });

    // Only Card is in the library — TextContent is NOT
    const lib = createLibrary({ components: [Card], root: "Card" });
    const prompt = lib.prompt();

    // Should still show "TextContent" from the WeakMap fallback, not "any"
    expect(prompt).toContain("TextContent");
    expect(prompt).not.toContain("children: any");
  });
});

// ─── assertV4Schema ─────────────────────────────────────────────────────────

describe("assertV4Schema", () => {
  it("throws for zod v3 schemas with a helpful message", () => {
    // Simulate a v3 schema shape: has _def but no _zod
    const fakeV3Schema = { _def: { typeName: "ZodObject" } };

    expect(() =>
      defineComponent({
        name: "Bad",
        props: fakeV3Schema as any,
        description: "test",
        component: Dummy,
      }),
    ).toThrow(/Zod 3 schema/);
  });

  it("accepts valid v4 schemas", () => {
    const schema = z.object({ name: z.string() });

    expect(() =>
      defineComponent({
        name: "Good",
        props: schema,
        description: "test",
        component: Dummy,
      }),
    ).not.toThrow();
  });
});

// ─── Library type ───────────────────────────────────────────────────────────

describe("Library type", () => {
  it("accepts a hand-built library with only the pre-1.0 members", () => {
    const mock: Library = {
      components: {},
      componentGroups: undefined,
      root: undefined,
      id: undefined,
      __libraryId: "mock",
      prompt: () => "",
      toSpec: () => createLibrary({ components: [] }).toSpec(),
      toJSONSchema: () => createLibrary({ components: [] }).toJSONSchema(),
    };
    expect(mock.functions).toBeUndefined();
  });
});
