import { createParser, type LibraryJSONSchema } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { mergeComponentStatements } from "../statement-patch";

const schema: LibraryJSONSchema = {
  $defs: {
    Stack: {
      properties: { children: {} },
      required: ["children"],
    },
    TextContent: {
      properties: { text: {} },
      required: ["text"],
    },
  },
};

const parser = createParser(schema);

describe("mergeComponentStatements", () => {
  it("compacts repeated statement IDs using last-write-wins semantics", () => {
    const source = mergeComponentStatements("", [
      "root = Stack([title])",
      'title = TextContent("Before")',
      'title = TextContent("After")',
    ]);

    expect(source).toBe('root = Stack([title])\ntitle = TextContent("After")');
    expect(parser.parse(source).meta.errors).toEqual([]);
  });

  it("preserves orphaned statements until a later patch references them", () => {
    const initial = mergeComponentStatements("", ["root = Stack([a])", 'a = TextContent("A")']);
    const withOrphan = mergeComponentStatements(initial, ['b = TextContent("B")']);

    expect(withOrphan).toContain('b = TextContent("B")');
    expect(parser.parse(withOrphan).meta.orphaned).toContain("b");

    const attached = mergeComponentStatements(withOrphan, ["root = Stack([a, b])"]);
    expect(parser.parse(attached).root?.props.children).toEqual([
      expect.objectContaining({ statementId: "a" }),
      expect.objectContaining({ statementId: "b" }),
    ]);
  });

  it("deletes statements only when a patch assigns null", () => {
    const existing = ["root = Stack([a, b])", 'a = TextContent("A")', 'b = TextContent("B")'].join(
      "\n",
    );
    const source = mergeComponentStatements(existing, ["b = null", "root = Stack([a])"]);

    expect(source).toBe('root = Stack([a])\na = TextContent("A")');
    expect(parser.parse(source).meta.errors).toEqual([]);
  });

  it("supports state IDs and top-level multiline ternaries accepted by lang-core", () => {
    const source = mergeComponentStatements("", [
      `$ready = true
      label = $ready
        ? "Ready"
        : "Waiting"
      root = TextContent(label)`,
    ]);
    const result = parser.parse(source);

    expect(source).toContain("$ready = true");
    expect(source).toContain('? "Ready"\n        : "Waiting"');
    expect(result.meta.errors).toEqual([]);
    expect(result.root?.props.text).toMatchObject({
      k: "Ternary",
      cond: { k: "StateRef", n: "$ready" },
      then: { k: "Str", v: "Ready" },
      else: { k: "Str", v: "Waiting" },
    });
  });

  it("keeps quoted newlines intact and strips a per-item Markdown fence", () => {
    const source = mergeComponentStatements("", [
      `\`\`\`openui
      message = 'line one
      line two'
      root = TextContent(message)
      \`\`\``,
    ]);
    const result = parser.parse(source);

    expect(source).not.toContain("```");
    expect(result.meta.errors).toEqual([]);
    expect(result.root?.props.text).toContain("line one");
    expect(result.root?.props.text).toContain("line two");
  });
});
