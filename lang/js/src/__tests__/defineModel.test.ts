import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createSchema, defineModel } from "../index";

describe("defineModel", () => {
  it("creates a Model with name, description, and schema", () => {
    const Contact = defineModel({
      name: "Contact",
      description: "A person's contact info",
      schema: z.object({
        name: z.string(),
        email: z.string(),
      }),
    });

    expect(Contact.name).toBe("Contact");
    expect(Contact.description).toBe("A person's contact info");
    expect(Contact.schema).toBeDefined();
    expect(Contact.ref).toBeDefined();
  });

  it("registers the schema in z.globalRegistry with id and description", () => {
    const RegisteredModel = defineModel({
      name: "RegisteredModel",
      description: "Test registration",
      schema: z.object({ value: z.string() }),
    });

    const meta = z.globalRegistry.get(RegisteredModel.schema);
    expect(meta?.id).toBe("RegisteredModel");
    expect((meta as any)?.description).toBe("Test registration");
  });

  it("ref can be used in parent schemas", () => {
    const Item = defineModel({
      name: "LineItemDM",
      description: "Invoice line item",
      schema: z.object({
        description: z.string(),
        amount: z.number(),
      }),
    });

    const Invoice = defineModel({
      name: "InvoiceDM",
      description: "Invoice with line items",
      schema: z.object({
        number: z.string(),
        items: z.array(Item.ref),
      }),
    });

    expect(Invoice.schema.shape.items).toBeDefined();
  });
});

describe("createSchema + defineModel integration", () => {
  it("creates a schema and parses valid input", () => {
    const Contact = defineModel({
      name: "Contact2",
      description: "Contact info",
      schema: z.object({
        name: z.string(),
        email: z.string(),
      }),
    });

    const schema = createSchema([Contact]);

    const result = schema.parse('root = Contact2("Alice", "alice@example.com")');
    expect(result.root).toEqual({ name: "Alice", email: "alice@example.com" });
    expect(result.meta.rootType).toBe("Contact2");
    expect(result.meta.validationErrors).toHaveLength(0);
  });

  it("auto-discovers sub-models from root schema", () => {
    const Tag = defineModel({
      name: "AutoTag",
      description: "A tag",
      schema: z.object({ label: z.string() }),
    });

    const Article = defineModel({
      name: "AutoArticle",
      description: "An article",
      schema: z.object({
        title: z.string(),
        tags: z.array(Tag.ref),
      }),
    });

    // Only pass Article — Tag should be auto-discovered
    const schema = createSchema([Article]);

    expect(schema.models["AutoArticle"]).toBeDefined();
    expect(schema.models["AutoTag"]).toBeDefined();
    expect(schema.root).toBe("AutoArticle");

    const input = `root = AutoArticle("Hello World", [t1, t2])
t1 = AutoTag("javascript")
t2 = AutoTag("typescript")`;

    const result = schema.parse(input);
    expect(result.root).toEqual({
      title: "Hello World",
      tags: [{ label: "javascript" }, { label: "typescript" }],
    });
    expect(result.meta.rootType).toBe("AutoArticle");
  });

  it("supports multi-root schemas", () => {
    const Invoice = defineModel({
      name: "MultiInvoice",
      description: "An invoice",
      schema: z.object({ number: z.string() }),
    });

    const Receipt = defineModel({
      name: "MultiReceipt",
      description: "A receipt",
      schema: z.object({ store: z.string(), total: z.number() }),
    });

    const schema = createSchema([Invoice, Receipt]);

    expect(schema.root).toEqual(["MultiInvoice", "MultiReceipt"]);

    const r1 = schema.parse('root = MultiInvoice("INV-001")');
    expect(r1.root).toEqual({ number: "INV-001" });
    expect(r1.meta.rootType).toBe("MultiInvoice");

    const r2 = schema.parse('root = MultiReceipt("Shop", 42)');
    expect(r2.root).toEqual({ store: "Shop", total: 42 });
    expect(r2.meta.rootType).toBe("MultiReceipt");
  });

  it("schema.root is undefined for empty createSchema", () => {
    const schema = createSchema([]);
    expect(schema.root).toBeUndefined();
  });

  it("schema.root is a string for single root", () => {
    const M = defineModel({
      name: "SingleRoot",
      description: "Single root model",
      schema: z.object({ v: z.string() }),
    });
    const schema = createSchema([M]);
    expect(schema.root).toBe("SingleRoot");
  });

  it("reports validation errors for missing required fields", () => {
    const Person = defineModel({
      name: "PersonDM",
      description: "A person",
      schema: z.object({
        firstName: z.string(),
        lastName: z.string(),
        age: z.number(),
      }),
    });

    const schema = createSchema([Person]);

    const result = schema.parse('root = PersonDM("Alice")');
    expect(result.root).toBeNull();
    expect(result.meta.validationErrors.length).toBeGreaterThan(0);
    expect(result.meta.validationErrors[0].type).toBe("PersonDM");
  });

  it("handles optional fields correctly", () => {
    const Note = defineModel({
      name: "NoteDM",
      description: "A note",
      schema: z.object({
        title: z.string(),
        body: z.string().optional(),
      }),
    });

    const schema = createSchema([Note]);

    const result = schema.parse('root = NoteDM("My Note")');
    expect(result.root).toEqual({ title: "My Note" });
    expect(result.meta.validationErrors).toHaveLength(0);
  });

  it("validates enum fields", () => {
    const Status = defineModel({
      name: "StatusDM",
      description: "A status entry",
      schema: z.object({
        state: z.enum(["active", "inactive", "pending"]),
        label: z.string(),
      }),
    });

    const schema = createSchema([Status]);

    const valid = schema.parse('root = StatusDM("active", "Active item")');
    expect(valid.root).toEqual({ state: "active", label: "Active item" });

    const invalid = schema.parse('root = StatusDM("unknown", "Bad state")');
    expect(invalid.root).toBeNull();
    expect(invalid.meta.validationErrors.length).toBeGreaterThan(0);
  });

  it("handles deeply nested types (3+ levels) via auto-discovery", () => {
    const Leaf = defineModel({
      name: "DeepLeafDM",
      description: "A leaf",
      schema: z.object({ value: z.string() }),
    });

    const Branch = defineModel({
      name: "DeepBranchDM",
      description: "A branch",
      schema: z.object({ leaves: z.array(Leaf.ref) }),
    });

    const Tree = defineModel({
      name: "DeepTreeDM",
      description: "A tree",
      schema: z.object({ branches: z.array(Branch.ref) }),
    });

    const Forest = defineModel({
      name: "DeepForestDM",
      description: "A forest",
      schema: z.object({ trees: z.array(Tree.ref) }),
    });

    // Only pass Forest — all sub-models should be auto-discovered
    const schema = createSchema([Forest]);

    expect(schema.models["DeepLeafDM"]).toBeDefined();
    expect(schema.models["DeepBranchDM"]).toBeDefined();
    expect(schema.models["DeepTreeDM"]).toBeDefined();
    expect(schema.models["DeepForestDM"]).toBeDefined();

    const input = `root = DeepForestDM([t1])
t1 = DeepTreeDM([b1])
b1 = DeepBranchDM([l1, l2])
l1 = DeepLeafDM("leaf-a")
l2 = DeepLeafDM("leaf-b")`;

    const result = schema.parse(input);
    expect(result.root).toEqual({
      trees: [
        {
          branches: [
            { leaves: [{ value: "leaf-a" }, { value: "leaf-b" }] },
          ],
        },
      ],
    });
    expect(result.meta.validationErrors).toHaveLength(0);
    expect(result.meta.rootType).toBe("DeepForestDM");
  });

  it("validates number constraints (min/max)", () => {
    const Bounded = defineModel({
      name: "BoundedNumDM",
      description: "Bounded number",
      schema: z.object({
        score: z.number().min(0).max(100),
      }),
    });

    const schema = createSchema([Bounded]);

    const valid = schema.parse("root = BoundedNumDM(50)");
    expect(valid.root).toEqual({ score: 50 });
    expect(valid.meta.validationErrors).toHaveLength(0);

    const tooLow = schema.parse("root = BoundedNumDM(-1)");
    expect(tooLow.root).toBeNull();
    expect(tooLow.meta.validationErrors[0].type).toBe("BoundedNumDM");

    const tooHigh = schema.parse("root = BoundedNumDM(101)");
    expect(tooHigh.root).toBeNull();
    expect(tooHigh.meta.validationErrors[0].type).toBe("BoundedNumDM");
  });

  it("handles string length constraints", () => {
    const Constrained = defineModel({
      name: "ConstrainedStrDM",
      description: "Constrained string",
      schema: z.object({
        code: z.string().min(2).max(5),
      }),
    });

    const schema = createSchema([Constrained]);

    const valid = schema.parse('root = ConstrainedStrDM("ABC")');
    expect(valid.root).toEqual({ code: "ABC" });
    expect(valid.meta.validationErrors).toHaveLength(0);

    const tooShort = schema.parse('root = ConstrainedStrDM("A")');
    expect(tooShort.root).toBeNull();
    expect(tooShort.meta.validationErrors.length).toBeGreaterThan(0);
  });

  it("handles multiple optional fields with partial arguments", () => {
    const Flexible = defineModel({
      name: "FlexTypeDM",
      description: "Many optionals",
      schema: z.object({
        required: z.string(),
        opt1: z.string().optional(),
        opt2: z.number().optional(),
        opt3: z.boolean().optional(),
      }),
    });

    const schema = createSchema([Flexible]);

    const minimal = schema.parse('root = FlexTypeDM("only-required")');
    expect(minimal.root).toEqual({ required: "only-required" });
    expect(minimal.meta.validationErrors).toHaveLength(0);

    const partial = schema.parse('root = FlexTypeDM("req", "extra")');
    expect(partial.root).toEqual({ required: "req", opt1: "extra" });
    expect(partial.meta.validationErrors).toHaveLength(0);

    const full = schema.parse('root = FlexTypeDM("req", "e", 42, true)');
    expect(full.root).toEqual({
      required: "req",
      opt1: "e",
      opt2: 42,
      opt3: true,
    });
  });

  it("handles empty arrays", () => {
    const EmptyArr = defineModel({
      name: "EmptyArrTypeDM",
      description: "Empty array",
      schema: z.object({
        label: z.string(),
        items: z.array(z.string()),
      }),
    });

    const schema = createSchema([EmptyArr]);

    const result = schema.parse('root = EmptyArrTypeDM("list", [])');
    expect(result.root).toEqual({ label: "list", items: [] });
    expect(result.meta.validationErrors).toHaveLength(0);
  });

  it("validates specific error paths for nested validation failures", () => {
    const Strict = defineModel({
      name: "StrictPersonDM",
      description: "Strict person",
      schema: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    });

    const schema = createSchema([Strict]);

    const result = schema.parse('root = StrictPersonDM("Alice", "not-an-email")');
    expect(result.root).toBeNull();
    expect(result.meta.validationErrors).toHaveLength(1);
    expect(result.meta.validationErrors[0]).toEqual({
      type: "StrictPersonDM",
      path: "/email",
      message: expect.stringContaining("email"),
    });
  });

  it("handles types with boolean-only schema", () => {
    const Flags = defineModel({
      name: "FlagTypeDM",
      description: "Boolean flags",
      schema: z.object({
        active: z.boolean(),
        visible: z.boolean(),
      }),
    });

    const schema = createSchema([Flags]);

    const result = schema.parse("root = FlagTypeDM(true, false)");
    expect(result.root).toEqual({ active: true, visible: false });
    expect(result.meta.validationErrors).toHaveLength(0);
  });

  it("meta.rootType is null for empty result", () => {
    const M = defineModel({
      name: "AnyModel",
      description: "Any model",
      schema: z.object({ v: z.string() }),
    });
    const schema = createSchema([M]);
    const result = schema.parse("");
    expect(result.root).toBeNull();
    expect(result.meta.rootType).toBeNull();
  });
});
