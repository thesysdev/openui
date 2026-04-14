import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent } from "../library.js";

// Dummy renderer — never actually called in these tests
const DummyComponent = (() => null) as any;

function makeComponent(name: string, schema: z.ZodObject, description: string) {
  return defineComponent({
    name,
    props: schema,
    description,
    component: DummyComponent,
  });
}

// ─── defineComponent ────────────────────────────────────────────────────────

describe("defineComponent", () => {
  it("returns an object with name, props, description, component, and ref", () => {
    const schema = z.object({ label: z.string() });
    const result = defineComponent({
      name: "Badge",
      props: schema,
      description: "A simple badge",
      component: DummyComponent,
    });

    expect(result.name).toBe("Badge");
    expect(result.props).toBe(schema);
    expect(result.description).toBe("A simple badge");
    expect(result.component).toBe(DummyComponent);
    expect(result.ref).toBeDefined();
  });

  it("stores the component name for later registration by createLibrary", () => {
    const schema = z.object({ title: z.string() });
    const comp = defineComponent({
      name: "Heading",
      props: schema,
      description: "A heading element",
      component: DummyComponent,
    });

    // defineComponent defers registration to createLibrary
    expect(comp.name).toBe("Heading");
    expect(comp.props).toBe(schema);
  });
});

// ─── createLibrary ──────────────────────────────────────────────────────────

describe("createLibrary", () => {
  const TextContent = makeComponent(
    "TextContent",
    z.object({ text: z.string() }),
    "Displays text content",
  );

  const Container = makeComponent(
    "Container",
    z.object({ title: z.string() }),
    "A container with a title",
  );

  it("creates a library with a components record", () => {
    const lib = createLibrary({ components: [TextContent, Container] });

    expect(lib.components["TextContent"]).toBe(TextContent);
    expect(lib.components["Container"]).toBe(Container);
    expect(Object.keys(lib.components)).toHaveLength(2);
  });

  it("stores root and componentGroups", () => {
    const lib = createLibrary({
      components: [TextContent],
      root: "TextContent",
      componentGroups: [{ name: "Display", components: ["TextContent"] }],
    });

    expect(lib.root).toBe("TextContent");
    expect(lib.componentGroups).toEqual([{ name: "Display", components: ["TextContent"] }]);
  });

  it("throws if root component is not found in components", () => {
    expect(() =>
      createLibrary({
        components: [TextContent],
        root: "NonExistent",
      }),
    ).toThrow(/Root component "NonExistent" was not found/);
  });

  it("prompt() returns a string containing component descriptions", () => {
    const lib = createLibrary({
      components: [TextContent, Container],
      root: "TextContent",
    });

    const prompt = lib.prompt();
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
    // The prompt should mention at least one component name
    expect(prompt).toContain("TextContent");
  });

  it("toJSONSchema() returns an object with $defs", () => {
    const lib = createLibrary({
      components: [TextContent],
      root: "TextContent",
    });

    const schema = lib.toJSONSchema() as Record<string, unknown>;
    expect(schema).toBeDefined();
    expect(typeof schema).toBe("object");
    expect(schema["$defs"]).toBeDefined();
    expect(typeof schema["$defs"]).toBe("object");
  });

  it("works without a root component", () => {
    const lib = createLibrary({ components: [TextContent] });

    expect(lib.root).toBeUndefined();
    // prompt/schema should still work
    expect(typeof lib.prompt()).toBe("string");
    expect(lib.toJSONSchema()).toBeDefined();
  });
});
