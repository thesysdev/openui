import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createSchema, defineType } from "../index";

describe("defineType", () => {
  it("creates a DefinedType with name, description, and props", () => {
    const Contact = defineType({
      name: "Contact",
      description: "A person's contact info",
      props: z.object({
        name: z.string(),
        email: z.string(),
      }),
    });

    expect(Contact.name).toBe("Contact");
    expect(Contact.description).toBe("A person's contact info");
    expect(Contact.props).toBeDefined();
    expect(Contact.ref).toBeDefined();
  });

  it("registers the schema in z.globalRegistry", () => {
    const RegisteredType = defineType({
      name: "RegisteredType",
      description: "Test registration",
      props: z.object({ value: z.string() }),
    });

    const meta = z.globalRegistry.get(RegisteredType.props);
    expect(meta?.id).toBe("RegisteredType");
  });

  it("ref can be used in parent schemas", () => {
    const Item = defineType({
      name: "LineItem",
      description: "Invoice line item",
      props: z.object({
        description: z.string(),
        amount: z.number(),
      }),
    });

    const Invoice = defineType({
      name: "Invoice",
      description: "Invoice with line items",
      props: z.object({
        number: z.string(),
        items: z.array(Item.ref),
      }),
    });

    expect(Invoice.props.shape.items).toBeDefined();
  });
});

describe("createSchema + defineType integration", () => {
  it("creates a schema and parses valid input", () => {
    const Contact = defineType({
      name: "Contact2",
      description: "Contact info",
      props: z.object({
        name: z.string(),
        email: z.string(),
      }),
    });

    const schema = createSchema({
      types: [Contact],
      root: "Contact2",
    });

    const result = schema.parse('root = Contact2("Alice", "alice@example.com")');
    expect(result.root).toEqual({ name: "Alice", email: "alice@example.com" });
    expect(result.meta.validationErrors).toHaveLength(0);
  });

  it("reports validation errors for missing required fields", () => {
    const Person = defineType({
      name: "Person",
      description: "A person",
      props: z.object({
        firstName: z.string(),
        lastName: z.string(),
        age: z.number(),
      }),
    });

    const schema = createSchema({
      types: [Person],
      root: "Person",
    });

    const result = schema.parse('root = Person("Alice")');
    expect(result.root).toBeNull();
    expect(result.meta.validationErrors.length).toBeGreaterThan(0);
    expect(result.meta.validationErrors[0].type).toBe("Person");
  });

  it("handles optional fields correctly", () => {
    const Note = defineType({
      name: "Note",
      description: "A note",
      props: z.object({
        title: z.string(),
        body: z.string().optional(),
      }),
    });

    const schema = createSchema({
      types: [Note],
      root: "Note",
    });

    const result = schema.parse('root = Note("My Note")');
    expect(result.root).toEqual({ title: "My Note" });
    expect(result.meta.validationErrors).toHaveLength(0);
  });

  it("handles nested types via ref", () => {
    const Tag = defineType({
      name: "Tag2",
      description: "A tag",
      props: z.object({ label: z.string() }),
    });

    const Article = defineType({
      name: "Article",
      description: "An article",
      props: z.object({
        title: z.string(),
        tags: z.array(Tag.ref),
      }),
    });

    const schema = createSchema({
      types: [Tag, Article],
      root: "Article",
    });

    const input = `root = Article("Hello World", [t1, t2])
t1 = Tag2("javascript")
t2 = Tag2("typescript")`;

    const result = schema.parse(input);
    expect(result.root).toEqual({
      title: "Hello World",
      tags: [{ label: "javascript" }, { label: "typescript" }],
    });
  });

  it("validates enum fields", () => {
    const Status = defineType({
      name: "Status",
      description: "A status entry",
      props: z.object({
        state: z.enum(["active", "inactive", "pending"]),
        label: z.string(),
      }),
    });

    const schema = createSchema({
      types: [Status],
      root: "Status",
    });

    const valid = schema.parse('root = Status("active", "Active item")');
    expect(valid.root).toEqual({ state: "active", label: "Active item" });

    const invalid = schema.parse('root = Status("unknown", "Bad state")');
    expect(invalid.root).toBeNull();
    expect(invalid.meta.validationErrors.length).toBeGreaterThan(0);
  });

  it("throws if root type is not found", () => {
    const Dummy = defineType({
      name: "Dummy",
      description: "dummy",
      props: z.object({ x: z.string() }),
    });

    expect(() => createSchema({ types: [Dummy], root: "NonExistent" })).toThrow(
      '[createSchema] Root type "NonExistent" was not found',
    );
  });

  it("handles deeply nested types (3+ levels)", () => {
    const Leaf = defineType({
      name: "DeepLeafDT",
      description: "A leaf",
      props: z.object({ value: z.string() }),
    });

    const Branch = defineType({
      name: "DeepBranchDT",
      description: "A branch",
      props: z.object({ leaves: z.array(Leaf.ref) }),
    });

    const Tree = defineType({
      name: "DeepTreeDT",
      description: "A tree",
      props: z.object({ branches: z.array(Branch.ref) }),
    });

    const Forest = defineType({
      name: "DeepForestDT",
      description: "A forest",
      props: z.object({ trees: z.array(Tree.ref) }),
    });

    const schema = createSchema({
      types: [Leaf, Branch, Tree, Forest],
      root: "DeepForestDT",
    });

    const input = `root = DeepForestDT([t1])
t1 = DeepTreeDT([b1])
b1 = DeepBranchDT([l1, l2])
l1 = DeepLeafDT("leaf-a")
l2 = DeepLeafDT("leaf-b")`;

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
  });

  it("validates number constraints (min/max)", () => {
    const Bounded = defineType({
      name: "BoundedNum",
      description: "Bounded number",
      props: z.object({
        score: z.number().min(0).max(100),
      }),
    });

    const schema = createSchema({ types: [Bounded], root: "BoundedNum" });

    const valid = schema.parse("root = BoundedNum(50)");
    expect(valid.root).toEqual({ score: 50 });
    expect(valid.meta.validationErrors).toHaveLength(0);

    const tooLow = schema.parse("root = BoundedNum(-1)");
    expect(tooLow.root).toBeNull();
    expect(tooLow.meta.validationErrors[0].type).toBe("BoundedNum");

    const tooHigh = schema.parse("root = BoundedNum(101)");
    expect(tooHigh.root).toBeNull();
    expect(tooHigh.meta.validationErrors[0].type).toBe("BoundedNum");
  });

  it("handles string length constraints", () => {
    const Constrained = defineType({
      name: "ConstrainedStr",
      description: "Constrained string",
      props: z.object({
        code: z.string().min(2).max(5),
      }),
    });

    const schema = createSchema({ types: [Constrained], root: "ConstrainedStr" });

    const valid = schema.parse('root = ConstrainedStr("ABC")');
    expect(valid.root).toEqual({ code: "ABC" });
    expect(valid.meta.validationErrors).toHaveLength(0);

    const tooShort = schema.parse('root = ConstrainedStr("A")');
    expect(tooShort.root).toBeNull();
    expect(tooShort.meta.validationErrors.length).toBeGreaterThan(0);
  });

  it("handles multiple optional fields with partial arguments", () => {
    const Flexible = defineType({
      name: "FlexType",
      description: "Many optionals",
      props: z.object({
        required: z.string(),
        opt1: z.string().optional(),
        opt2: z.number().optional(),
        opt3: z.boolean().optional(),
      }),
    });

    const schema = createSchema({ types: [Flexible], root: "FlexType" });

    const minimal = schema.parse('root = FlexType("only-required")');
    expect(minimal.root).toEqual({ required: "only-required" });
    expect(minimal.meta.validationErrors).toHaveLength(0);

    const partial = schema.parse('root = FlexType("req", "extra")');
    expect(partial.root).toEqual({ required: "req", opt1: "extra" });
    expect(partial.meta.validationErrors).toHaveLength(0);

    const full = schema.parse('root = FlexType("req", "e", 42, true)');
    expect(full.root).toEqual({
      required: "req",
      opt1: "e",
      opt2: 42,
      opt3: true,
    });
  });

  it("handles empty arrays", () => {
    const EmptyArr = defineType({
      name: "EmptyArrType",
      description: "Empty array",
      props: z.object({
        label: z.string(),
        items: z.array(z.string()),
      }),
    });

    const schema = createSchema({ types: [EmptyArr], root: "EmptyArrType" });

    const result = schema.parse('root = EmptyArrType("list", [])');
    expect(result.root).toEqual({ label: "list", items: [] });
    expect(result.meta.validationErrors).toHaveLength(0);
  });

  it("validates specific error paths for nested validation failures", () => {
    const Strict = defineType({
      name: "StrictPerson",
      description: "Strict person",
      props: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    });

    const schema = createSchema({ types: [Strict], root: "StrictPerson" });

    const result = schema.parse('root = StrictPerson("Alice", "not-an-email")');
    expect(result.root).toBeNull();
    expect(result.meta.validationErrors).toHaveLength(1);
    expect(result.meta.validationErrors[0]).toEqual({
      type: "StrictPerson",
      path: "/email",
      message: expect.stringContaining("email"),
    });
  });

  it("creates a schema without a root type", () => {
    const NoRoot = defineType({
      name: "NoRootType",
      description: "No root",
      props: z.object({ v: z.string() }),
    });

    const schema = createSchema({ types: [NoRoot] });
    expect(schema.root).toBeUndefined();

    const result = schema.parse('root = NoRootType("test")');
    expect(result.root).toEqual({ v: "test" });
  });

  it("handles types with boolean-only props", () => {
    const Flags = defineType({
      name: "FlagType",
      description: "Boolean flags",
      props: z.object({
        active: z.boolean(),
        visible: z.boolean(),
      }),
    });

    const schema = createSchema({ types: [Flags], root: "FlagType" });

    const result = schema.parse("root = FlagType(true, false)");
    expect(result.root).toEqual({ active: true, visible: false });
    expect(result.meta.validationErrors).toHaveLength(0);
  });
});
