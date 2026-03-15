import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createSchema, defineModel } from "../index";

describe("prompt generation", () => {
  it("uses 'Type Signatures' section header instead of 'Component Signatures'", () => {
    const T1 = defineModel({
      name: "PromptT1",
      description: "Type one",
      schema: z.object({ a: z.string() }),
    });

    const schema = createSchema([T1]);
    const prompt = schema.prompt();

    expect(prompt).toContain("## Type Signatures");
    expect(prompt).not.toContain("## Component Signatures");
  });

  it("includes type signatures with descriptions", () => {
    const Contact = defineModel({
      name: "PromptContact",
      description: "Contact information",
      schema: z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string().optional(),
      }),
    });

    const schema = createSchema([Contact]);
    const prompt = schema.prompt();

    expect(prompt).toContain("PromptContact(");
    expect(prompt).toContain("name: string");
    expect(prompt).toContain("email: string");
    expect(prompt).toContain("phone?: string");
    expect(prompt).toContain("— Contact information");
  });

  it("does not include action prop or UI rendering notes", () => {
    const T = defineModel({
      name: "PromptNoAction",
      description: "No action",
      schema: z.object({ v: z.string() }),
    });

    const schema = createSchema([T]);
    const prompt = schema.prompt();

    expect(prompt).not.toContain("action` prop");
    expect(prompt).not.toContain("ContinueConversation");
    expect(prompt).not.toContain("OpenUrl");
    expect(prompt).not.toContain("UI shell appears");
  });

  it("supports custom preamble", () => {
    const T = defineModel({
      name: "PromptCustom",
      description: "Custom",
      schema: z.object({ x: z.string() }),
    });

    const schema = createSchema([T]);
    const prompt = schema.prompt({ preamble: "You are a custom assistant." });

    expect(prompt).toContain("You are a custom assistant.");
    expect(prompt).not.toContain("data extraction assistant");
  });

  it("includes examples when provided", () => {
    const T = defineModel({
      name: "PromptEx",
      description: "Ex",
      schema: z.object({ x: z.string() }),
    });

    const schema = createSchema([T]);
    const prompt = schema.prompt({
      examples: ['root = PromptEx("hello")'],
    });

    expect(prompt).toContain("## Examples");
    expect(prompt).toContain('root = PromptEx("hello")');
  });

  it("includes additional rules when provided", () => {
    const T = defineModel({
      name: "PromptRules",
      description: "Rules",
      schema: z.object({ x: z.string() }),
    });

    const schema = createSchema([T]);
    const prompt = schema.prompt({
      additionalRules: ["Always use ISO dates", "Prefer metric units"],
    });

    expect(prompt).toContain("- Always use ISO dates");
    expect(prompt).toContain("- Prefer metric units");
  });

  it("generates correct root reference in syntax rules for single root", () => {
    const Root = defineModel({
      name: "MyRoot",
      description: "Root",
      schema: z.object({ title: z.string() }),
    });

    const schema = createSchema([Root]);
    const prompt = schema.prompt();

    expect(prompt).toContain("root = MyRoot(...)");
  });

  it("generates multi-root syntax rules containing 'one of'", () => {
    const Invoice = defineModel({
      name: "PromptInvoice",
      description: "An invoice",
      schema: z.object({ number: z.string() }),
    });

    const Receipt = defineModel({
      name: "PromptReceipt",
      description: "A receipt",
      schema: z.object({ store: z.string() }),
    });

    const schema = createSchema([Invoice, Receipt]);
    const prompt = schema.prompt();

    expect(prompt).toContain("one of");
    expect(prompt).toContain("PromptInvoice(...)");
    expect(prompt).toContain("PromptReceipt(...)");
  });

  it("generates multi-root streaming and important rules with joined names", () => {
    const A = defineModel({
      name: "MultiA",
      description: "Multi A",
      schema: z.object({ x: z.string() }),
    });
    const B = defineModel({
      name: "MultiB",
      description: "Multi B",
      schema: z.object({ y: z.string() }),
    });

    const schema = createSchema([A, B]);
    const prompt = schema.prompt();

    // Both roots should appear in the prompt
    expect(prompt).toContain("MultiA | MultiB");
  });

  it("generates JSON schema", () => {
    const T = defineModel({
      name: "PromptJsonSchema",
      description: "JSON Schema test",
      schema: z.object({ x: z.string(), y: z.number().optional() }),
    });

    const schema = createSchema([T]);
    const jsonSchema = schema.toJSONSchema();

    expect(jsonSchema).toHaveProperty("$defs");
  });

  it("falls back to 'Root' when no root model is specified", () => {
    const schema = createSchema([]);
    const prompt = schema.prompt();

    expect(prompt).toContain("root = Root(...)");
  });

  it("includes enum annotations in type signatures", () => {
    const EnumType = defineModel({
      name: "PromptEnum",
      description: "Enum type",
      schema: z.object({
        status: z.enum(["active", "inactive", "pending"]),
        label: z.string(),
      }),
    });

    const schema = createSchema([EnumType]);
    const prompt = schema.prompt();

    expect(prompt).toContain('"active" | "inactive" | "pending"');
    expect(prompt).toContain("label: string");
  });

  it("includes array annotations in type signatures", () => {
    const ChildType = defineModel({
      name: "PromptArrChild",
      description: "Array child",
      schema: z.object({ v: z.string() }),
    });

    const ParentType = defineModel({
      name: "PromptArrParent",
      description: "Array parent",
      schema: z.object({
        name: z.string(),
        children: z.array(ChildType.ref),
      }),
    });

    // Only pass ParentType — ChildType auto-discovered
    const schema = createSchema([ParentType]);
    const prompt = schema.prompt();

    expect(prompt).toContain("PromptArrChild[]");
  });

  it("includes optional array annotations", () => {
    const ItemType = defineModel({
      name: "PromptOptItem",
      description: "Item",
      schema: z.object({ v: z.string() }),
    });

    const OptArr = defineModel({
      name: "PromptOptArr",
      description: "Optional array",
      schema: z.object({
        items: z.array(ItemType.ref).optional(),
      }),
    });

    const schema = createSchema([OptArr]);
    const prompt = schema.prompt();

    expect(prompt).toContain("items?:");
    expect(prompt).toContain("PromptOptItem[]");
  });

  it("includes hoisting and streaming rules section", () => {
    const T = defineModel({
      name: "PromptHoist",
      description: "Hoist test",
      schema: z.object({ v: z.string() }),
    });

    const schema = createSchema([T]);
    const prompt = schema.prompt();

    expect(prompt).toContain("## Hoisting & Forward References");
    expect(prompt).toContain("root = PromptHoist(...)");
  });

  it("includes important rules section", () => {
    const T = defineModel({
      name: "PromptImportant",
      description: "Important",
      schema: z.object({ v: z.string() }),
    });

    const schema = createSchema([T]);
    const prompt = schema.prompt();

    expect(prompt).toContain("## Important Rules");
    expect(prompt).toContain("ALWAYS start with root = PromptImportant(...)");
  });

  it("does not include Examples section when no examples provided", () => {
    const T = defineModel({
      name: "PromptNoEx",
      description: "No examples",
      schema: z.object({ v: z.string() }),
    });

    const schema = createSchema([T]);
    const prompt = schema.prompt();

    expect(prompt).not.toContain("## Examples");
  });

  it("generates JSON schema with correct structure", () => {
    const T = defineModel({
      name: "PromptJsonDetail",
      description: "Detailed JSON schema",
      schema: z.object({
        name: z.string(),
        count: z.number().optional(),
        active: z.boolean(),
      }),
    });

    const schema = createSchema([T]);
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
    const T = defineModel({
      name: "PromptSyntax",
      description: "Syntax",
      schema: z.object({ v: z.string() }),
    });

    const schema = createSchema([T]);
    const prompt = schema.prompt();

    expect(prompt).toContain("## Syntax Rules");
    expect(prompt).toContain("POSITIONAL");
    expect(prompt).toContain("double quotes");
  });

  it("supports multiple examples", () => {
    const T = defineModel({
      name: "PromptMultiEx",
      description: "Multi example",
      schema: z.object({ x: z.string() }),
    });

    const schema = createSchema([T]);
    const prompt = schema.prompt({
      examples: ['root = PromptMultiEx("first")', 'root = PromptMultiEx("second")'],
    });

    expect(prompt).toContain("## Examples");
    expect(prompt).toContain('root = PromptMultiEx("first")');
    expect(prompt).toContain('root = PromptMultiEx("second")');
  });
});
