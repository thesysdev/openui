import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createSchema, defineType } from "../index";

describe("parser — plain object output", () => {
  const Item = defineType({
    name: "PItem",
    description: "A simple item",
    props: z.object({
      name: z.string(),
      value: z.number(),
    }),
  });

  const Container = defineType({
    name: "PContainer",
    description: "Holds items",
    props: z.object({
      title: z.string(),
      items: z.array(Item.ref),
    }),
  });

  const schema = createSchema({
    types: [Item, Container],
    root: "PContainer",
  });

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

  it("handles boolean and null values", () => {
    const BoolType = defineType({
      name: "BoolType",
      description: "Bool test",
      props: z.object({
        flag: z.boolean(),
        label: z.string(),
      }),
    });

    const boolSchema = createSchema({
      types: [BoolType],
      root: "BoolType",
    });

    const result = boolSchema.parse('root = BoolType(true, "test")');
    expect(result.root).toEqual({ flag: true, label: "test" });
  });

  it("handles objects as prop values", () => {
    const MetaType = defineType({
      name: "MetaType",
      description: "Has metadata object",
      props: z.object({
        name: z.string(),
        meta: z.record(z.string(), z.unknown()).optional(),
      }),
    });

    const metaSchema = createSchema({
      types: [MetaType],
      root: "MetaType",
    });

    const result = metaSchema.parse('root = MetaType("test", {key: "value"})');
    expect(result.root).toEqual({
      name: "test",
      meta: { key: "value" },
    });
  });

  it("parses escaped strings (quotes, newlines, backslashes)", () => {
    const EscType = defineType({
      name: "EscType",
      description: "Escaped string test",
      props: z.object({ text: z.string() }),
    });

    const escSchema = createSchema({ types: [EscType], root: "EscType" });

    const withQuotes = escSchema.parse('root = EscType("say \\"hello\\"")');
    expect(withQuotes.root).toEqual({ text: 'say "hello"' });

    const withNewline = escSchema.parse('root = EscType("line1\\nline2")');
    expect(withNewline.root).toEqual({ text: "line1\nline2" });

    const withBackslash = escSchema.parse('root = EscType("path\\\\to\\\\file")');
    expect(withBackslash.root).toEqual({ text: "path\\to\\file" });
  });

  it("parses negative numbers", () => {
    const NumType = defineType({
      name: "NegNumType",
      description: "Negative number test",
      props: z.object({ value: z.number() }),
    });

    const numSchema = createSchema({ types: [NumType], root: "NegNumType" });

    const result = numSchema.parse("root = NegNumType(-42)");
    expect(result.root).toEqual({ value: -42 });

    const decimal = numSchema.parse("root = NegNumType(-3.14)");
    expect(decimal.root).toEqual({ value: -3.14 });
  });

  it("parses scientific notation numbers", () => {
    const SciType = defineType({
      name: "SciType",
      description: "Sci notation test",
      props: z.object({ value: z.number() }),
    });

    const sciSchema = createSchema({ types: [SciType], root: "SciType" });

    const result = sciSchema.parse("root = SciType(1e5)");
    expect(result.root).toEqual({ value: 100000 });

    const negExp = sciSchema.parse("root = SciType(2.5E-3)");
    expect(negExp.root).toEqual({ value: 0.0025 });

    const posExp = sciSchema.parse("root = SciType(1.2e+4)");
    expect(posExp.root).toEqual({ value: 12000 });
  });

  it("parses explicit null arguments", () => {
    const NullType = defineType({
      name: "NullableType",
      description: "Nullable test",
      props: z.object({
        label: z.string(),
        extra: z.string().nullable().optional(),
      }),
    });

    const nullSchema = createSchema({ types: [NullType], root: "NullableType" });

    const result = nullSchema.parse('root = NullableType("hello", null)');
    expect(result.root).toEqual({ label: "hello", extra: null });
  });

  it("handles circular references without infinite loop", () => {
    const NodeType = defineType({
      name: "CircNode",
      description: "Node with potential cycle",
      props: z.object({ label: z.string() }),
    });

    const circSchema = createSchema({ types: [NodeType], root: "CircNode" });

    const input = `root = CircNode(a)\na = b\nb = a`;
    const result = circSchema.parse(input);
    expect(result.meta.unresolved.length).toBeGreaterThan(0);
  });

  it("handles malformed input gracefully", () => {
    const MalType = defineType({
      name: "MalType",
      description: "Malformed test",
      props: z.object({ x: z.string() }),
    });

    const malSchema = createSchema({ types: [MalType], root: "MalType" });

    const garbage = malSchema.parse("!!!???");
    expect(garbage.root).toBeNull();

    const noEquals = malSchema.parse("just some words");
    expect(noEquals.root).toBeNull();

    const partial = malSchema.parse("root =");
    expect(partial.root).toBeNull();
  });

  it("uses the first statement as root when multiple root= lines exist", () => {
    const MultiRoot = defineType({
      name: "MultiRootType",
      description: "Multi root test",
      props: z.object({ val: z.string() }),
    });

    const mrSchema = createSchema({ types: [MultiRoot], root: "MultiRootType" });

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
    const LeafType = defineType({
      name: "DeepLeaf",
      description: "Leaf",
      props: z.object({ v: z.string() }),
    });
    const MidType = defineType({
      name: "DeepMid",
      description: "Mid",
      props: z.object({ children: z.array(LeafType.ref) }),
    });
    const TopType = defineType({
      name: "DeepTop",
      description: "Top",
      props: z.object({ mids: z.array(MidType.ref) }),
    });

    const deepSchema = createSchema({
      types: [LeafType, MidType, TopType],
      root: "DeepTop",
    });

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
    const StrictType = defineType({
      name: "StrictValType",
      description: "Strict validation",
      props: z.object({
        email: z.string().email(),
        age: z.number().min(0),
      }),
    });

    const strictSchema = createSchema({
      types: [StrictType],
      root: "StrictValType",
    });

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
    const Simple = defineType({
      name: "SItem",
      description: "Simple",
      props: z.object({ name: z.string() }),
    });

    const schema = createSchema({
      types: [Simple],
      root: "SItem",
    });

    const parser = schema.streamingParser();

    let result = parser.push('root = SItem("He');
    expect(result.meta.incomplete).toBe(true);
    expect(result.root).toEqual({ name: "He" });

    result = parser.push('llo")');
    expect(result.root).toEqual({ name: "Hello" });
  });

  it("resolves references as they stream in", () => {
    const Child = defineType({
      name: "SChild",
      description: "Child",
      props: z.object({ val: z.string() }),
    });

    const Parent = defineType({
      name: "SParent",
      description: "Parent",
      props: z.object({
        name: z.string(),
        children: z.array(Child.ref),
      }),
    });

    const schema = createSchema({
      types: [Child, Parent],
      root: "SParent",
    });

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
    const Simple2 = defineType({
      name: "S2",
      description: "S2",
      props: z.object({ x: z.string() }),
    });

    const schema = createSchema({ types: [Simple2], root: "S2" });
    const parser = schema.streamingParser();

    parser.push('root = S2("test")');
    const r1 = parser.getResult();
    const r2 = parser.getResult();
    expect(r1).toEqual(r2);
  });

  it("handles character-by-character streaming", () => {
    const CharType = defineType({
      name: "CharStream",
      description: "Char-by-char",
      props: z.object({ v: z.string() }),
    });

    const schema = createSchema({ types: [CharType], root: "CharStream" });
    const parser = schema.streamingParser();

    const full = 'root = CharStream("hi")';
    let result;
    for (const char of full) {
      result = parser.push(char);
    }
    expect(result!.root).toEqual({ v: "hi" });
  });

  it("handles multi-statement streaming across chunks", () => {
    const StreamChild = defineType({
      name: "StreamChild",
      description: "Child",
      props: z.object({ v: z.string() }),
    });
    const StreamParent = defineType({
      name: "StreamParent",
      description: "Parent",
      props: z.object({
        title: z.string(),
        items: z.array(StreamChild.ref),
      }),
    });

    const schema = createSchema({
      types: [StreamChild, StreamParent],
      root: "StreamParent",
    });
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
    const DoneType = defineType({
      name: "StreamDone",
      description: "Done",
      props: z.object({ x: z.string() }),
    });

    const schema = createSchema({ types: [DoneType], root: "StreamDone" });
    const parser = schema.streamingParser();

    parser.push('root = StreamDone("done")\n');
    const result = parser.getResult();
    expect(result.meta.incomplete).toBe(false);
    expect(result.root).toEqual({ x: "done" });
  });

  it("handles empty push calls", () => {
    const EmptyPush = defineType({
      name: "EmptyPush",
      description: "EP",
      props: z.object({ x: z.string() }),
    });

    const schema = createSchema({ types: [EmptyPush], root: "EmptyPush" });
    const parser = schema.streamingParser();

    let result = parser.push("");
    expect(result.root).toBeNull();

    result = parser.push('root = EmptyPush("val")');
    expect(result.root).toEqual({ x: "val" });
  });
});
