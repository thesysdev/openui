import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createSchema, createSchemaMap, defineType } from "../index";

describe("createSchemaMap", () => {
  const InvoiceItem = defineType({
    name: "InvItem",
    description: "Invoice line item",
    props: z.object({
      description: z.string(),
      amount: z.number(),
    }),
  });

  const InvoiceRoot = defineType({
    name: "InvRoot",
    description: "Invoice",
    props: z.object({
      number: z.string(),
      items: z.array(InvoiceItem.ref),
    }),
  });

  const ReceiptRoot = defineType({
    name: "RecRoot",
    description: "Receipt",
    props: z.object({
      store: z.string(),
      total: z.number(),
    }),
  });

  const invoiceSchema = createSchema({
    types: [InvoiceItem, InvoiceRoot],
    root: "InvRoot",
  });

  const receiptSchema = createSchema({
    types: [ReceiptRoot],
    root: "RecRoot",
  });

  it("creates a Root wrapper and sets it as the root", () => {
    const map = createSchemaMap({ invoice: invoiceSchema, receipt: receiptSchema });

    expect(map.root).toBe("Root");
    expect(map.types.Root).toBeDefined();
  });

  it("parses Root-wrapped input and unwraps automatically", () => {
    const map = createSchemaMap({ invoice: invoiceSchema, receipt: receiptSchema });

    const result = map.parse(
      `root = Root(inv)\ninv = InvRoot("INV-001", [i1])\ni1 = InvItem("Widget", 100)`,
    );

    expect(result.root).toEqual({
      number: "INV-001",
      items: [{ description: "Widget", amount: 100 }],
    });
    expect(result.meta.validationErrors).toHaveLength(0);
  });

  it("parses inline Root-wrapped input", () => {
    const map = createSchemaMap({ invoice: invoiceSchema, receipt: receiptSchema });

    const result = map.parse('root = Root(RecRoot("Acme Store", 42.5))');

    expect(result.root).toEqual({ store: "Acme Store", total: 42.5 });
  });

  it("generates a prompt with Root wrapper and all child types", () => {
    const map = createSchemaMap({ invoice: invoiceSchema, receipt: receiptSchema });

    const prompt = map.prompt();

    expect(prompt).toContain("root = Root(...)");
    expect(prompt).toContain("Root(");
    expect(prompt).toContain("InvRoot");
    expect(prompt).toContain("InvItem");
    expect(prompt).toContain("RecRoot");
  });

  it("streaming parser unwraps Root automatically", () => {
    const map = createSchemaMap({ invoice: invoiceSchema, receipt: receiptSchema });

    const parser = map.streamingParser();

    let result = parser.push('root = Root(inv)\ninv = InvRoot("X", [a])\n');
    expect(result.root).toBeNull();

    result = parser.push('a = InvItem("Y", 10)');
    expect(result.root).toEqual({
      number: "X",
      items: [{ description: "Y", amount: 10 }],
    });
  });

  it("streaming getResult also unwraps", () => {
    const map = createSchemaMap({ invoice: invoiceSchema, receipt: receiptSchema });

    const parser = map.streamingParser();
    parser.push('root = Root(RecRoot("Shop", 10))\n');

    const r1 = parser.getResult();
    const r2 = parser.getResult();
    expect(r1.root).toEqual({ store: "Shop", total: 10 });
    expect(r1).toEqual(r2);
  });

  it("generates a merged JSON schema with Root and all types", () => {
    const map = createSchemaMap({ invoice: invoiceSchema, receipt: receiptSchema });

    const jsonSchema = map.toJSONSchema() as any;

    expect(jsonSchema.$defs).toBeDefined();
    expect(jsonSchema.$defs.Root).toBeDefined();
    expect(jsonSchema.$defs.InvRoot).toBeDefined();
    expect(jsonSchema.$defs.InvItem).toBeDefined();
    expect(jsonSchema.$defs.RecRoot).toBeDefined();
  });

  it("exposes individual schemas via .schemas", () => {
    const map = createSchemaMap({ invoice: invoiceSchema, receipt: receiptSchema });

    expect(map.schemas.invoice).toBe(invoiceSchema);
    expect(map.schemas.receipt).toBe(receiptSchema);
  });

  it("allows calling prompt() and streamingParser() on individual schemas", () => {
    const map = createSchemaMap({ invoice: invoiceSchema, receipt: receiptSchema });

    const prompt = map.schemas.invoice.prompt();
    expect(prompt).toContain("InvRoot");
    expect(prompt).not.toContain("RecRoot");

    const parser = map.schemas.receipt.streamingParser();
    const result = parser.push('root = RecRoot("Test", 99)');
    expect(result.root).toEqual({ store: "Test", total: 99 });
  });

  it("throws when created with no schemas", () => {
    expect(() => createSchemaMap({})).toThrow("At least one schema is required");
  });

  it("works with a single-schema map", () => {
    const map = createSchemaMap({ invoice: invoiceSchema });

    expect(map.root).toBe("Root");

    const result = map.parse(
      `root = Root(inv)\ninv = InvRoot("SOLO-001", [i1])\ni1 = InvItem("Solo", 50)`,
    );
    expect(result.root).toEqual({
      number: "SOLO-001",
      items: [{ description: "Solo", amount: 50 }],
    });
  });

  it("returns null root when inner validation fails", () => {
    const map = createSchemaMap({ invoice: invoiceSchema, receipt: receiptSchema });

    const result = map.parse('root = Root(RecRoot("store"))');
    expect(result.root).toBeNull();
    expect(result.meta.validationErrors.length).toBeGreaterThan(0);
  });

  it("falls back to no root when schemas have no roots defined", () => {
    const noRootSchema = createSchema({
      types: [defineType({ name: "Foo", description: "Foo", props: z.object({ x: z.string() }) })],
    });

    const map = createSchemaMap({ a: noRootSchema });

    expect(map.root).toBeUndefined();
    expect(map.types.Root).toBeUndefined();
  });

  it("deduplicates shared types across schemas", () => {
    const Shared = defineType({
      name: "SharedItem2",
      description: "Shared",
      props: z.object({ v: z.string() }),
    });

    const schemaA = createSchema({
      types: [
        Shared,
        defineType({ name: "WrapA2", description: "A", props: z.object({ item: Shared.ref }) }),
      ],
      root: "WrapA2",
    });

    const schemaB = createSchema({
      types: [
        Shared,
        defineType({ name: "WrapB2", description: "B", props: z.object({ item: Shared.ref }) }),
      ],
      root: "WrapB2",
    });

    const map = createSchemaMap({ a: schemaA, b: schemaB });

    expect(Object.keys(map.types).filter((n) => n === "SharedItem2")).toHaveLength(1);
    expect(map.types.WrapA2).toBeDefined();
    expect(map.types.WrapB2).toBeDefined();
  });
});
