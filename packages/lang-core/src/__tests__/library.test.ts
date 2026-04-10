import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent, tagSchemaId } from "../library";

const Dummy = null as any;

// ─── tagSchemaId + registry integration ─────────────────────────────────────

describe("tagSchemaId", () => {
  it("tagged schema appears in prompt signatures", () => {
    const actionSchema = z.any();
    tagSchemaId(actionSchema, "ActionExpression");

    const Button = defineComponent({
      name: "Button",
      props: z.object({ label: z.string(), action: actionSchema.optional() }),
      description: "A button",
      component: Dummy,
    });

    const lib = createLibrary({ components: [Button], root: "Button" });
    const prompt = lib.prompt();

    expect(prompt).toContain("action?: ActionExpression");
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
