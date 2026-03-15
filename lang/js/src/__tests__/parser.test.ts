import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createSchema, defineModel } from "../index";

describe("parser — plain object output", () => {
  const Item = defineModel({
    name: "PItem",
    description: "A simple item",
    schema: z.object({
      name: z.string(),
      value: z.number(),
    }),
  });

  const Container = defineModel({
    name: "PContainer",
    description: "Holds items",
    schema: z.object({
      title: z.string(),
      items: z.array(Item.ref),
    }),
  });

  // Item is auto-discovered from Container.schema
  const schema = createSchema([Container]);

  it("parses a flat type to a plain object", () => {
    const result = schema.parse('root = PItem("test", 42)');
    expect(result.root).toEqual({ name: "test", value: 42 });
  });

  it("parses nested types with references", () => {
    const input = `root = PContainer("Inventory", [a, b])
a = PItem("Widget", 10)
b = PItem("Gadget", 20)`;

    const result = schema.parse(input);
    expect(result.root).toEqual({
      title: "Inventory",
      items: [
        { name: "Widget", value: 10 },
        { name: "Gadget", value: 20 },
      ],
    });
  });

  it("returns null root for empty input", () => {
    const result = schema.parse("");
    expect(result.root).toBeNull();
    expect(result.meta.incomplete).toBe(true);
    expect(result.meta.rootType).toBeNull();
  });

  it("handles hoisting (forward references)", () => {
    const input = `root = PContainer("List", [item1])
item1 = PItem("First", 1)`;

    const result = schema.parse(input);
    expect(result.root).toEqual({
      title: "List",
      items: [{ name: "First", value: 1 }],
    });
  });

  it("tracks unresolved references", () => {
    const input = `root = PContainer("List", [missing])`;
    const result = schema.parse(input);
    expect(result.meta.unresolved).toContain("missing");
  });

  it("counts statements", () => {
    const input = `root = PContainer("X", [a])
a = PItem("Y", 1)`;
    const result = schema.parse(input);
    expect(result.meta.statementCount).toBe(2);
  });

  it("populates meta.rootType from the root Comp node name", () => {
    const result = schema.parse('root = PContainer("Test", [])');
    expect(result.meta.rootType).toBe("PContainer");
  });

  it("handles boolean and null values", () => {
    const BoolType = defineModel({
      name: "BoolType",
      description: "Bool test",
      schema: z.object({
        flag: z.boolean(),
        label: z.string(),
      }),
    });

    const boolSchema = createSchema([BoolType]);

    const result = boolSchema.parse('root = BoolType(true, "test")');
    expect(result.root).toEqual({ flag: true, label: "test" });
  });

  it("handles objects as prop values", () => {
    const MetaType = defineModel({
      name: "MetaType",
      description: "Has metadata object",
      schema: z.object({
        name: z.string(),
        meta: z.record(z.string(), z.unknown()).optional(),
      }),
    });

    const metaSchema = createSchema([MetaType]);

    const result = metaSchema.parse('root = MetaType("test", {key: "value"})');
    expect(result.root).toEqual({
      name: "test",
      meta: { key: "value" },
    });
  });

  it("parses escaped strings (quotes, newlines, backslashes)", () => {
    const EscType = defineModel({
      name: "EscType",
      description: "Escaped string test",
      schema: z.object({ text: z.string() }),
    });

    const escSchema = createSchema([EscType]);

    const withQuotes = escSchema.parse('root = EscType("say \\"hello\\"")');
    expect(withQuotes.root).toEqual({ text: 'say "hello"' });

    const withNewline = escSchema.parse('root = EscType("line1\\nline2")');
    expect(withNewline.root).toEqual({ text: "line1\nline2" });

    const withBackslash = escSchema.parse('root = EscType("path\\\\to\\\\file")');
    expect(withBackslash.root).toEqual({ text: "path\\to\\file" });
  });

  it("parses negative numbers", () => {
    const NumType = defineModel({
      name: "NegNumType",
      description: "Negative number test",
      schema: z.object({ value: z.number() }),
    });

    const numSchema = createSchema([NumType]);

    const result = numSchema.parse("root = NegNumType(-42)");
    expect(result.root).toEqual({ value: -42 });

    const decimal = numSchema.parse("root = NegNumType(-3.14)");
    expect(decimal.root).toEqual({ value: -3.14 });
  });

  it("parses scientific notation numbers", () => {
    const SciType = defineModel({
      name: "SciType",
      description: "Sci notation test",
      schema: z.object({ value: z.number() }),
    });

    const sciSchema = createSchema([SciType]);

    const result = sciSchema.parse("root = SciType(1e5)");
    expect(result.root).toEqual({ value: 100000 });

    const negExp = sciSchema.parse("root = SciType(2.5E-3)");
    expect(negExp.root).toEqual({ value: 0.0025 });

    const posExp = sciSchema.parse("root = SciType(1.2e+4)");
    expect(posExp.root).toEqual({ value: 12000 });
  });

  it("parses explicit null arguments", () => {
    const NullType = defineModel({
      name: "NullableType",
      description: "Nullable test",
      schema: z.object({
        label: z.string(),
        extra: z.string().nullable().optional(),
      }),
    });

    const nullSchema = createSchema([NullType]);

    const result = nullSchema.parse('root = NullableType("hello", null)');
    expect(result.root).toEqual({ label: "hello", extra: null });
  });

  it("handles circular references without infinite loop", () => {
    const NodeType = defineModel({
      name: "CircNode",
      description: "Node with potential cycle",
      schema: z.object({ label: z.string() }),
    });

    const circSchema = createSchema([NodeType]);

    const input = `root = CircNode(a)\na = b\nb = a`;
    const result = circSchema.parse(input);
    expect(result.meta.unresolved.length).toBeGreaterThan(0);
  });

  it("handles malformed input gracefully", () => {
    const MalType = defineModel({
      name: "MalType",
      description: "Malformed test",
      schema: z.object({ x: z.string() }),
    });

    const malSchema = createSchema([MalType]);

    const garbage = malSchema.parse("!!!???");
    expect(garbage.root).toBeNull();

    const noEquals = malSchema.parse("just some words");
    expect(noEquals.root).toBeNull();

    const partial = malSchema.parse("root =");
    expect(partial.root).toBeNull();
  });

  it("uses the first statement as root when multiple root= lines exist", () => {
    const MultiRoot = defineModel({
      name: "MultiRootType",
      description: "Multi root test",
      schema: z.object({ val: z.string() }),
    });

    const mrSchema = createSchema([MultiRoot]);

    const input = `root = MultiRootType("first")\nroot = MultiRootType("second")`;
    const result = mrSchema.parse(input);
    expect(result.root).toEqual({ val: "second" });
  });

  it("marks complete input as not incomplete", () => {
    const result = schema.parse('root = PItem("done", 99)');
    expect(result.meta.incomplete).toBe(false);
  });

  it("marks input with unclosed parens as incomplete", () => {
    const result = schema.parse('root = PItem("partial", 1');
    expect(result.meta.incomplete).toBe(true);
    expect(result.root).toEqual({ name: "partial", value: 1 });
  });

  it("handles whitespace-only input", () => {
    const result = schema.parse("   \n\t\n  ");
    expect(result.root).toBeNull();
    expect(result.meta.incomplete).toBe(true);
  });

  it("handles deeply nested arrays", () => {
    const LeafType = defineModel({
      name: "DeepLeaf",
      description: "Leaf",
      schema: z.object({ v: z.string() }),
    });
    const MidType = defineModel({
      name: "DeepMid",
      description: "Mid",
      schema: z.object({ children: z.array(LeafType.ref) }),
    });
    const TopType = defineModel({
      name: "DeepTop",
      description: "Top",
      schema: z.object({ mids: z.array(MidType.ref) }),
    });

    // TopType → MidType → LeafType, all auto-discovered
    const deepSchema = createSchema([TopType]);

    const input = `root = DeepTop([m1, m2])
m1 = DeepMid([l1])
m2 = DeepMid([l2, l3])
l1 = DeepLeaf("a")
l2 = DeepLeaf("b")
l3 = DeepLeaf("c")`;

    const result = deepSchema.parse(input);
    expect(result.root).toEqual({
      mids: [
        { children: [{ v: "a" }] },
        { children: [{ v: "b" }, { v: "c" }] },
      ],
    });
    expect(result.meta.validationErrors).toHaveLength(0);
  });

  it("returns specific validation error paths and messages", () => {
    const StrictType = defineModel({
      name: "StrictValType",
      description: "Strict validation",
      schema: z.object({
        email: z.string().email(),
        age: z.number().min(0),
      }),
    });

    const strictSchema = createSchema([StrictType]);

    const result = strictSchema.parse('root = StrictValType("not-email", -5)');
    expect(result.root).toBeNull();
    expect(result.meta.validationErrors.length).toBeGreaterThan(0);
    expect(result.meta.validationErrors[0].type).toBe("StrictValType");
    expect(result.meta.validationErrors[0].path).toBeDefined();
    expect(result.meta.validationErrors[0].message).toBeDefined();
  });
});

describe("streamingParser — plain object output", () => {
  it("progressively builds the result", () => {
    const Simple = defineModel({
      name: "SItem",
      description: "Simple",
      schema: z.object({ name: z.string() }),
    });

    const schema = createSchema([Simple]);

    const parser = schema.streamingParser();

    let result = parser.push('root = SItem("He');
    expect(result.meta.incomplete).toBe(true);
    expect(result.root).toEqual({ name: "He" });

    result = parser.push('llo")');
    expect(result.root).toEqual({ name: "Hello" });
  });

  it("resolves references as they stream in", () => {
    const Child = defineModel({
      name: "SChild",
      description: "Child",
      schema: z.object({ val: z.string() }),
    });

    const Parent = defineModel({
      name: "SParent",
      description: "Parent",
      schema: z.object({
        name: z.string(),
        children: z.array(Child.ref),
      }),
    });

    const schema = createSchema([Parent]);

    const parser = schema.streamingParser();

    let result = parser.push('root = SParent("Parent", [c1])\n');
    expect(result.meta.unresolved).toContain("c1");
    expect(result.root).toBeNull();

    result = parser.push('c1 = SChild("child1")');
    expect(result.root).toEqual({
      name: "Parent",
      children: [{ val: "child1" }],
    });
    expect(result.meta.unresolved).toHaveLength(0);
  });

  it("getResult returns the latest without consuming new data", () => {
    const Simple2 = defineModel({
      name: "S2",
      description: "S2",
      schema: z.object({ x: z.string() }),
    });

    const schema = createSchema([Simple2]);
    const parser = schema.streamingParser();

    parser.push('root = S2("test")');
    const r1 = parser.getResult();
    const r2 = parser.getResult();
    expect(r1).toEqual(r2);
  });

  it("handles character-by-character streaming", () => {
    const CharType = defineModel({
      name: "CharStream",
      description: "Char-by-char",
      schema: z.object({ v: z.string() }),
    });

    const schema = createSchema([CharType]);
    const parser = schema.streamingParser();

    const full = 'root = CharStream("hi")';
    let result;
    for (const char of full) {
      result = parser.push(char);
    }
    expect(result!.root).toEqual({ v: "hi" });
  });

  it("handles multi-statement streaming across chunks", () => {
    const StreamChild = defineModel({
      name: "StreamChild",
      description: "Child",
      schema: z.object({ v: z.string() }),
    });
    const StreamParent = defineModel({
      name: "StreamParent",
      description: "Parent",
      schema: z.object({
        title: z.string(),
        items: z.array(StreamChild.ref),
      }),
    });

    const schema = createSchema([StreamParent]);
    const parser = schema.streamingParser();

    let result = parser.push('root = StreamParent("List", [a, b])\n');
    expect(result.root).toBeNull();
    expect(result.meta.unresolved).toContain("a");

    result = parser.push('a = StreamChild("first")\n');
    expect(result.meta.unresolved).toContain("b");
    expect(result.root).toBeNull();

    result = parser.push('b = StreamChild("second")');
    expect(result.meta.unresolved).toHaveLength(0);
    expect(result.root).toEqual({
      title: "List",
      items: [{ v: "first" }, { v: "second" }],
    });
  });

  it("returns incomplete=false for fully closed streaming input", () => {
    const DoneType = defineModel({
      name: "StreamDone",
      description: "Done",
      schema: z.object({ x: z.string() }),
    });

    const schema = createSchema([DoneType]);
    const parser = schema.streamingParser();

    parser.push('root = StreamDone("done")\n');
    const result = parser.getResult();
    expect(result.meta.incomplete).toBe(false);
    expect(result.root).toEqual({ x: "done" });
  });

  it("handles empty push calls", () => {
    const EmptyPush = defineModel({
      name: "EmptyPush",
      description: "EP",
      schema: z.object({ x: z.string() }),
    });

    const schema = createSchema([EmptyPush]);
    const parser = schema.streamingParser();

    let result = parser.push("");
    expect(result.root).toBeNull();

    result = parser.push('root = EmptyPush("val")');
    expect(result.root).toEqual({ x: "val" });
  });
});
