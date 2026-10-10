import { describe, expect, it } from "vitest";
import type { Library } from "../../library";
import { mergeStatements } from "../merge";
import { parse } from "../parser";
import { jsonToOpenUI } from "../serialize";
import type { ElementNode, ParamMap } from "../types";

// ── Fake library for tests ──────────────────────────────────────────────────

/**
 * Minimal fake library that provides toJSONSchema() matching the test schema.
 * Components: Stack(children), Title(text), Table(columns, rows), Card(title, subtitle)
 */
function createFakeLibrary(): Library {
  return {
    components: {},
    componentGroups: undefined,
    root: undefined,
    prompt: () => "",
    toSpec: () => ({ components: {} }),
    toJSONSchema: () => ({
      $defs: {
        Stack: {
          properties: { children: { type: "array" } },
          required: ["children"],
        },
        Title: {
          properties: { text: { type: "string" } },
          required: ["text"],
        },
        Table: {
          properties: {
            columns: { type: "array" },
            rows: { type: "array" },
          },
          required: ["columns", "rows"],
        },
        Card: {
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
          },
          required: ["title"],
        },
      },
    }),
  } as unknown as Library;
}

const library = createFakeLibrary();

// Build the same ParamMap the parser uses, for parse() calls
const schema: ParamMap = new Map([
  ["Stack", { params: [{ name: "children", required: true }] }],
  ["Title", { params: [{ name: "text", required: true }] }],
  [
    "Table",
    {
      params: [
        { name: "columns", required: true },
        { name: "rows", required: true },
      ],
    },
  ],
  [
    "Card",
    {
      params: [
        { name: "title", required: true },
        { name: "subtitle", required: false },
      ],
    },
  ],
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse openui-lang, serialize back, parse again, compare root trees. */
function roundTrip(input: string) {
  const result1 = parse(input, schema);
  expect(result1.root).not.toBeNull();
  const serialized = jsonToOpenUI(result1.root!, library);
  const result2 = parse(serialized, schema);
  return { result1, result2, serialized };
}

function stripDynamic(node: ElementNode): object {
  const { partial, hasDynamicProps, ...rest } = node;
  const cleanProps: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest.props)) {
    if (isElNode(v)) {
      cleanProps[k] = stripDynamic(v);
    } else if (Array.isArray(v)) {
      cleanProps[k] = v.map((el) => (isElNode(el) ? stripDynamic(el) : el));
    } else {
      cleanProps[k] = v;
    }
  }
  return { ...rest, props: cleanProps };
}

function isElNode(v: unknown): v is ElementNode {
  return v !== null && typeof v === "object" && (v as Record<string, unknown>).type === "element";
}

// ── Basic serialization ─────────────────────────────────────────────────────

describe("jsonToOpenUI", () => {
  describe("single component", () => {
    it("serializes a simple component", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: { text: "Hello" },
        partial: false,
        hasDynamicProps: false,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toBe('root = Title("Hello")');
    });

    it("uses statementId as root name", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: { text: "Hi" },
        partial: false,
        statementId: "header",
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toBe('header = Title("Hi")');
    });
  });

  describe("nested components", () => {
    it("extracts children with statementId as separate statements", () => {
      const child: ElementNode = {
        type: "element",
        typeName: "Title",
        props: { text: "Hello" },
        partial: false,
        statementId: "header",
      };
      const root: ElementNode = {
        type: "element",
        typeName: "Stack",
        props: { children: [child] },
        partial: false,
        statementId: "root",
      };
      const result = jsonToOpenUI(root, library);
      expect(result).toContain("root = Stack([header])");
      expect(result).toContain('header = Title("Hello")');
    });

    it("inlines components without statementId", () => {
      const child: ElementNode = {
        type: "element",
        typeName: "Title",
        props: { text: "Inline" },
        partial: false,
      };
      const root: ElementNode = {
        type: "element",
        typeName: "Stack",
        props: { children: [child] },
        partial: false,
      };
      const result = jsonToOpenUI(root, library);
      expect(result).toBe('root = Stack([Title("Inline")])');
    });
  });

  // ── Value types ──────────────────────────────────────────────────────────

  describe("value types", () => {
    it("serializes strings with escaping", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: { text: 'Hello "world"' },
        partial: false,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toBe('root = Title("Hello \\"world\\"")');
    });

    it("serializes numbers", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Table",
        props: { columns: [42], rows: [[3.14]] },
        partial: false,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toContain("42");
      expect(result).toContain("3.14");
    });

    it("serializes booleans", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Table",
        props: { columns: [true], rows: [[false]] },
        partial: false,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toContain("true");
      expect(result).toContain("false");
    });

    it("serializes null", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Table",
        props: { columns: [null], rows: [[]] },
        partial: false,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toContain("null");
    });

    it("serializes plain objects", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Table",
        props: {
          columns: [{ name: "col1", key: "id" }],
          rows: [],
        },
        partial: false,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toContain('{name: "col1", key: "id"}');
    });
  });

  // ── Positional arg ordering ──────────────────────────────────────────────

  describe("positional arg ordering", () => {
    it("maps props to positional args via ParamMap", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Table",
        props: { columns: ["A", "B"], rows: [[1, 2]] },
        partial: false,
      };
      const result = jsonToOpenUI(node, library);
      // columns first, rows second per ParamMap
      expect(result).toBe('root = Table(["A", "B"], [[1, 2]])');
    });

    it("trims trailing optional args", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Card",
        props: { title: "Hello" },
        partial: false,
      };
      const result = jsonToOpenUI(node, library);
      // subtitle is optional and undefined → trimmed
      expect(result).toBe('root = Card("Hello")');
    });

    it("fills middle gaps with null", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Table",
        props: { rows: [[1, 2]] },
        partial: false,
      };
      const result = jsonToOpenUI(node, library);
      // columns is required but missing → null, rows follows
      expect(result).toBe("root = Table(null, [[1, 2]])");
    });
  });

  // ── AST node serialization ─────────────────────────────────────────────

  describe("AST nodes in dynamic props", () => {
    it("serializes StateRef", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: { text: { k: "StateRef", n: "$name" } },
        partial: false,
        hasDynamicProps: true,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toBe("root = Title($name)");
    });

    it("serializes RuntimeRef", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: { text: { k: "RuntimeRef", n: "queryData", refType: "query" } },
        partial: false,
        hasDynamicProps: true,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toBe("root = Title(queryData)");
    });

    it("serializes BinOp with correct precedence", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: {
          text: {
            k: "BinOp",
            op: "*",
            left: {
              k: "BinOp",
              op: "+",
              left: { k: "StateRef", n: "$a" },
              right: { k: "StateRef", n: "$b" },
            },
            right: { k: "StateRef", n: "$c" },
          },
        },
        partial: false,
        hasDynamicProps: true,
      };
      const result = jsonToOpenUI(node, library);
      // + has lower precedence than * → needs parens
      expect(result).toBe("root = Title(($a + $b) * $c)");
    });

    it("serializes Ternary", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: {
          text: {
            k: "Ternary",
            cond: { k: "StateRef", n: "$active" },
            then: { k: "Str", v: "Yes" },
            else: { k: "Str", v: "No" },
          },
        },
        partial: false,
        hasDynamicProps: true,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toBe('root = Title($active ? "Yes" : "No")');
    });

    it("serializes Member access", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: {
          text: {
            k: "Member",
            obj: { k: "RuntimeRef", n: "data", refType: "query" as const },
            field: "name",
          },
        },
        partial: false,
        hasDynamicProps: true,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toBe("root = Title(data.name)");
    });

    it("serializes Index access", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: {
          text: {
            k: "Index",
            obj: { k: "RuntimeRef", n: "items", refType: "query" as const },
            index: { k: "Num", v: 0 },
          },
        },
        partial: false,
        hasDynamicProps: true,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toBe("root = Title(items[0])");
    });

    it("serializes UnaryOp", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: {
          text: {
            k: "UnaryOp",
            op: "!",
            operand: { k: "StateRef", n: "$flag" },
          },
        },
        partial: false,
        hasDynamicProps: true,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toBe("root = Title(!$flag)");
    });
  });

  // ── Builtin serialization ──────────────────────────────────────────────

  describe("builtins", () => {
    it("serializes builtins with @ prefix", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: {
          text: {
            k: "Comp",
            name: "Count",
            args: [{ k: "RuntimeRef", n: "items", refType: "query" as const }],
          },
        },
        partial: false,
        hasDynamicProps: true,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toBe("root = Title(@Count(items))");
    });

    it("serializes Action without @ prefix", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: {
          text: {
            k: "Comp",
            name: "Action",
            args: [
              {
                k: "Arr",
                els: [
                  {
                    k: "Comp",
                    name: "Run",
                    args: [{ k: "Ref", n: "myQuery" }],
                  },
                ],
              },
            ],
          },
        },
        partial: false,
        hasDynamicProps: true,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toContain("Action([@Run(myQuery)])");
    });
  });

  // ── State declarations ─────────────────────────────────────────────────

  describe("state declarations", () => {
    it("includes non-null state declarations", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: { text: "Hi" },
        partial: false,
      };
      const result = jsonToOpenUI(node, library, {
        stateDeclarations: { $count: 0, $name: "default" },
      });
      expect(result).toContain("$count = 0");
      expect(result).toContain('$name = "default"');
    });

    it("omits null state declarations", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: { text: "Hi" },
        partial: false,
      };
      const result = jsonToOpenUI(node, library, {
        stateDeclarations: { $filter: null },
      });
      expect(result).not.toContain("$filter");
    });
  });

  // ── Round-trip tests ───────────────────────────────────────────────────

  describe("round-trip", () => {
    it("round-trips a simple component", () => {
      const { result1, result2 } = roundTrip('root = Title("Hello")');
      expect(stripDynamic(result2.root!)).toEqual(stripDynamic(result1.root!));
    });

    it("round-trips nested components", () => {
      const input =
        'root = Stack([header, tbl])\nheader = Title("Hi")\ntbl = Table(["A", "B"], [[1, 2]])';
      const { result1, result2 } = roundTrip(input);
      expect(stripDynamic(result2.root!)).toEqual(stripDynamic(result1.root!));
    });

    it("round-trips with optional args", () => {
      const { result1, result2 } = roundTrip('root = Card("Main Title")');
      expect(stripDynamic(result2.root!)).toEqual(stripDynamic(result1.root!));
    });
  });

  // ── Integration with mergeStatements ───────────────────────────────────

  describe("mergeStatements integration", () => {
    it("serialized output works as a merge patch", () => {
      const existing = 'root = Stack([header])\nheader = Title("Old")';

      // Build a modified tree
      const modifiedChild: ElementNode = {
        type: "element",
        typeName: "Title",
        props: { text: "New" },
        partial: false,
        statementId: "header",
      };
      const modifiedRoot: ElementNode = {
        type: "element",
        typeName: "Stack",
        props: { children: [modifiedChild] },
        partial: false,
        statementId: "root",
      };

      const patch = jsonToOpenUI(modifiedRoot, library);
      const merged = mergeStatements(existing, patch);

      expect(merged).toBe('root = Stack([header])\nheader = Title("New")');

      // Parse the merged result to verify
      const result = parse(merged, schema);
      expect(result.root).not.toBeNull();
      expect(result.root!.typeName).toBe("Stack");
      // The child should have the new text
      const children = result.root!.props.children as ElementNode[];
      expect(children[0].props.text).toBe("New");
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles empty children array", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Stack",
        props: { children: [] },
        partial: false,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toBe("root = Stack([])");
    });

    it("handles partial nodes", () => {
      const node: ElementNode = {
        type: "element",
        typeName: "Title",
        props: { text: "Streaming" },
        partial: true,
      };
      const result = jsonToOpenUI(node, library);
      expect(result).toBe('root = Title("Streaming")');
    });

    it("handles duplicate statementIds without infinite loop", () => {
      const child: ElementNode = {
        type: "element",
        typeName: "Title",
        props: { text: "Same" },
        partial: false,
        statementId: "shared",
      };
      const root: ElementNode = {
        type: "element",
        typeName: "Stack",
        props: { children: [child, child] },
        partial: false,
      };
      const result = jsonToOpenUI(root, library);
      // Should reference "shared" twice but only define once
      expect(result).toContain("Stack([shared, shared])");
      const matches = result.match(/shared = Title/g);
      expect(matches).toHaveLength(1);
    });
  });
});
