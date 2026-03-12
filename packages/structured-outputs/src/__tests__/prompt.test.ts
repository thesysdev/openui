import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createSchema, defineType } from "../index";

describe("prompt generation", () => {
  it("uses 'Type Signatures' section header instead of 'Component Signatures'", () => {
    const T1 = defineType({
      name: "PromptT1",
      description: "Type one",
      props: z.object({ a: z.string() }),
    });

    const schema = createSchema({ types: [T1] });
    const prompt = schema.prompt();

    expect(prompt).toContain("## Type Signatures");
    expect(prompt).not.toContain("## Component Signatures");
  });

  it("includes type signatures with descriptions", () => {
    const Contact = defineType({
      name: "PromptContact",
      description: "Contact information",
      props: z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string().optional(),
      }),
    });

    const schema = createSchema({ types: [Contact], root: "PromptContact" });
    const prompt = schema.prompt();

    expect(prompt).toContain("PromptContact(");
    expect(prompt).toContain("name: string");
    expect(prompt).toContain("email: string");
    expect(prompt).toContain("phone?: string");
    expect(prompt).toContain("— Contact information");
  });

  it("does not include action prop or UI rendering notes", () => {
    const T = defineType({
      name: "PromptNoAction",
      description: "No action",
      props: z.object({ v: z.string() }),
    });

    const schema = createSchema({ types: [T] });
    const prompt = schema.prompt();

    expect(prompt).not.toContain("action` prop");
    expect(prompt).not.toContain("ContinueConversation");
    expect(prompt).not.toContain("OpenUrl");
    expect(prompt).not.toContain("UI shell appears");
  });

  it("supports custom preamble", () => {
    const T = defineType({
      name: "PromptCustom",
      description: "Custom",
      props: z.object({ x: z.string() }),
    });

    const schema = createSchema({ types: [T] });
    const prompt = schema.prompt({ preamble: "You are a custom assistant." });

    expect(prompt).toContain("You are a custom assistant.");
    expect(prompt).not.toContain("data extraction assistant");
  });

  it("includes examples when provided", () => {
    const T = defineType({
      name: "PromptEx",
      description: "Ex",
      props: z.object({ x: z.string() }),
    });

    const schema = createSchema({ types: [T], root: "PromptEx" });
    const prompt = schema.prompt({
      examples: ['root = PromptEx("hello")'],
    });

    expect(prompt).toContain("## Examples");
    expect(prompt).toContain('root = PromptEx("hello")');
  });

  it("includes additional rules when provided", () => {
    const T = defineType({
      name: "PromptRules",
      description: "Rules",
      props: z.object({ x: z.string() }),
    });

    const schema = createSchema({ types: [T] });
    const prompt = schema.prompt({
      additionalRules: ["Always use ISO dates", "Prefer metric units"],
    });

    expect(prompt).toContain("- Always use ISO dates");
    expect(prompt).toContain("- Prefer metric units");
  });

  it("supports typeGroups", () => {
    const A = defineType({
      name: "PromptGroupA",
      description: "Type A",
      props: z.object({ x: z.string() }),
    });
    const B = defineType({
      name: "PromptGroupB",
      description: "Type B",
      props: z.object({ y: z.number() }),
    });

    const schema = createSchema({
      types: [A, B],
      typeGroups: [
        { name: "Primary", types: ["PromptGroupA"] },
        { name: "Secondary", types: ["PromptGroupB"], notes: ["Use sparingly"] },
      ],
    });

    const prompt = schema.prompt();
    expect(prompt).toContain("### Primary");
    expect(prompt).toContain("### Secondary");
    expect(prompt).toContain("Use sparingly");
  });

  it("generates correct root reference in syntax rules", () => {
    const Root = defineType({
      name: "MyRoot",
      description: "Root",
      props: z.object({ title: z.string() }),
    });

    const schema = createSchema({ types: [Root], root: "MyRoot" });
    const prompt = schema.prompt();

    expect(prompt).toContain("root = MyRoot(...)");
  });

  it("generates JSON schema", () => {
    const T = defineType({
      name: "PromptJsonSchema",
      description: "JSON Schema test",
      props: z.object({ x: z.string(), y: z.number().optional() }),
    });

    const schema = createSchema({ types: [T] });
    const jsonSchema = schema.toJSONSchema();

    expect(jsonSchema).toHaveProperty("$defs");
  });

  it("falls back to 'Root' when no root type is specified", () => {
    const T = defineType({
      name: "PromptNoRoot",
      description: "No root",
      props: z.object({ v: z.string() }),
    });

    const schema = createSchema({ types: [T] });
    const prompt = schema.prompt();

    expect(prompt).toContain("root = Root(...)");
  });

  it("includes enum annotations in type signatures", () => {
    const EnumType = defineType({
      name: "PromptEnum",
      description: "Enum type",
      props: z.object({
        status: z.enum(["active", "inactive", "pending"]),
        label: z.string(),
      }),
    });

    const schema = createSchema({ types: [EnumType] });
    const prompt = schema.prompt();

    expect(prompt).toContain('"active" | "inactive" | "pending"');
    expect(prompt).toContain("label: string");
  });

  it("includes array annotations in type signatures", () => {
    const ChildType = defineType({
      name: "PromptArrChild",
      description: "Array child",
      props: z.object({ v: z.string() }),
    });

    const ParentType = defineType({
      name: "PromptArrParent",
      description: "Array parent",
      props: z.object({
        name: z.string(),
        children: z.array(ChildType.ref),
      }),
    });

    const schema = createSchema({ types: [ChildType, ParentType] });
    const prompt = schema.prompt();

    expect(prompt).toContain("PromptArrChild[]");
  });

  it("includes optional array annotations", () => {
    const ItemType = defineType({
      name: "PromptOptItem",
      description: "Item",
      props: z.object({ v: z.string() }),
    });

    const OptArr = defineType({
      name: "PromptOptArr",
      description: "Optional array",
      props: z.object({
        items: z.array(ItemType.ref).optional(),
      }),
    });

    const schema = createSchema({ types: [ItemType, OptArr] });
    const prompt = schema.prompt();

    expect(prompt).toContain("items?:");
    expect(prompt).toContain("PromptOptItem[]");
  });

  it("includes hoisting and streaming rules section", () => {
    const T = defineType({
      name: "PromptHoist",
      description: "Hoist test",
      props: z.object({ v: z.string() }),
    });

    const schema = createSchema({ types: [T], root: "PromptHoist" });
    const prompt = schema.prompt();

    expect(prompt).toContain("## Hoisting & Forward References");
    expect(prompt).toContain("root = PromptHoist(...)");
  });

  it("includes important rules section", () => {
    const T = defineType({
      name: "PromptImportant",
      description: "Important",
      props: z.object({ v: z.string() }),
    });

    const schema = createSchema({ types: [T], root: "PromptImportant" });
    const prompt = schema.prompt();

    expect(prompt).toContain("## Important Rules");
    expect(prompt).toContain("ALWAYS start with root = PromptImportant(...)");
  });

  it("does not include Examples section when no examples provided", () => {
    const T = defineType({
      name: "PromptNoEx",
      description: "No examples",
      props: z.object({ v: z.string() }),
    });

    const schema = createSchema({ types: [T] });
    const prompt = schema.prompt();

    expect(prompt).not.toContain("## Examples");
  });

  it("lists ungrouped types when some types are not in any group", () => {
    const A = defineType({
      name: "PromptUngroupedA",
      description: "Grouped",
      props: z.object({ x: z.string() }),
    });
    const B = defineType({
      name: "PromptUngroupedB",
      description: "Ungrouped",
      props: z.object({ y: z.number() }),
    });

    const schema = createSchema({
      types: [A, B],
      typeGroups: [{ name: "Group1", types: ["PromptUngroupedA"] }],
    });

    const prompt = schema.prompt();
    expect(prompt).toContain("### Group1");
    expect(prompt).toContain("### Ungrouped");
    expect(prompt).toContain("PromptUngroupedB(");
  });

  it("generates JSON schema with correct structure", () => {
    const T = defineType({
      name: "PromptJsonDetail",
      description: "Detailed JSON schema",
      props: z.object({
        name: z.string(),
        count: z.number().optional(),
        active: z.boolean(),
      }),
    });

    const schema = createSchema({ types: [T] });
    const jsonSchema = schema.toJSONSchema() as any;

    expect(jsonSchema.$defs).toBeDefined();
    const typeDef = jsonSchema.$defs.PromptJsonDetail;
    expect(typeDef).toBeDefined();
    expect(typeDef.properties).toBeDefined();
    expect(typeDef.properties.name).toBeDefined();
    expect(typeDef.properties.active).toBeDefined();
    expect(typeDef.required).toContain("name");
    expect(typeDef.required).toContain("active");
  });

  it("includes syntax rules section", () => {
    const T = defineType({
      name: "PromptSyntax",
      description: "Syntax",
      props: z.object({ v: z.string() }),
    });

    const schema = createSchema({ types: [T], root: "PromptSyntax" });
    const prompt = schema.prompt();

    expect(prompt).toContain("## Syntax Rules");
    expect(prompt).toContain("POSITIONAL");
    expect(prompt).toContain("double quotes");
  });

  it("supports multiple examples", () => {
    const T = defineType({
      name: "PromptMultiEx",
      description: "Multi example",
      props: z.object({ x: z.string() }),
    });

    const schema = createSchema({ types: [T], root: "PromptMultiEx" });
    const prompt = schema.prompt({
      examples: ['root = PromptMultiEx("first")', 'root = PromptMultiEx("second")'],
    });

    expect(prompt).toContain("## Examples");
    expect(prompt).toContain('root = PromptMultiEx("first")');
    expect(prompt).toContain('root = PromptMultiEx("second")');
  });
});
