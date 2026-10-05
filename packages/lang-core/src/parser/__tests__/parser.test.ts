import { describe, expect, it } from "vitest";
import { createStreamParser, parse } from "../parser";
import type { ParamMap } from "../types";

// ── Test schema ──────────────────────────────────────────────────────────────

/**
 * Minimal schema used across tests.
 *
 * Stack takes one param (children), Title takes one (text),
 * Table takes two (columns, rows). These cover the common test cases.
 */
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
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

const errors = (input: string) => parse(input, schema).meta.errors;
const codes = (input: string) => errors(input).map((e: { code: string }) => e.code);

// ── unknown-component ────────────────────────────────────────────────────────

describe("unknown-component", () => {
  it("reports when component name is not in schema", () => {
    const result = parse('root = DataTable("col")', schema);
    expect(result.meta.errors).toHaveLength(1);
    expect(result.meta.errors[0]).toMatchObject({
      code: "unknown-component",
      component: "DataTable",
    });
  });

  it("drops unknown component from tree (returns null)", () => {
    const result = parse('root = DataTable("col")', schema);
    expect(result.root).toBeNull();
  });

  it("reports all unknown components in a tree", () => {
    const r = codes('root = Stack([Ghost("a")])\n');
    expect(r).toContain("unknown-component");
  });

  it("does not report for known component names", () => {
    const result = parse('root = Stack(["hello"])', schema);
    expect(codes('root = Stack(["hello"])')).not.toContain("unknown-component");
    expect(result.meta.errors).toHaveLength(0);
  });
});

// ── excess-args ───────────────────────────────────────────────────────────────

describe("excess-args", () => {
  it("reports excess-args error but still renders with valid args", () => {
    const result = parse('root = Title("hello", "extra")', schema);
    expect(codes('root = Title("hello", "extra")')).toContain("excess-args");
    // Extra args dropped, first arg maps correctly
    expect(result.root).not.toBeNull();
    expect(result.root?.props.text).toBe("hello");
  });

  it("excess-args message lists count", () => {
    const errs = errors('root = Title("hello", "extra", "more")');
    const excess = errs.find((e: { code: string }) => e.code === "excess-args");
    expect(excess).toBeDefined();
    expect(excess!.message).toContain("2 excess dropped");
  });

  it("does not report when arg count matches param count", () => {
    expect(codes('root = Title("hello")')).not.toContain("excess-args");
  });

  it("does not report when fewer args than params (handled by missing-required)", () => {
    expect(codes("root = Table([], [])")).not.toContain("excess-args");
  });
});

// ── unresolved references ────────────────────────────────────────────────────

describe("unresolved references", () => {
  it("tracks unresolved refs in meta.unresolved (one-shot)", () => {
    const result = parse("root = Stack([tbl])", schema);
    expect(result.meta.unresolved).toContain("tbl");
  });

  it("does not produce errors for unresolved refs", () => {
    const result = parse("root = Stack([tbl])", schema);
    expect(result.meta.errors).toHaveLength(0);
  });

  it("clears unresolved when ref is defined", () => {
    const result = parse('root = Stack([tbl])\ntbl = Title("hello")', schema);
    expect(result.meta.unresolved).toHaveLength(0);
  });
});

// ── unresolved references (streaming) ─────────────────────────────────────────

describe("unresolved references (streaming)", () => {
  it("tracks unresolved refs mid-stream without errors", () => {
    const parser = createStreamParser(schema);
    const midResult = parser.push("root = Stack([tbl])\n");
    expect(midResult.meta.unresolved).toContain("tbl");
    expect(midResult.meta.errors).toHaveLength(0);
  });

  it("resolves automatically when ref is defined in a later chunk", () => {
    const parser = createStreamParser(schema);
    parser.push("root = Stack([tbl])\n");
    const result = parser.push('tbl = Title("hello")\n');
    expect(result.meta.unresolved).toHaveLength(0);
  });

  it("keeps unresolved refs in meta.unresolved at end of stream", () => {
    const parser = createStreamParser(schema);
    parser.push("root = Stack([tbl])\n");
    const result = parser.getResult();
    expect(result.meta.unresolved).toContain("tbl");
    expect(result.meta.errors).toHaveLength(0);
  });
});

// ── existing error rules ──────────────────────────────────────────────────────

describe("existing errors carry type and code", () => {
  it("missing-required has correct shape", () => {
    const result = parse("root = Stack()", schema);
    expect(result.meta.errors).toHaveLength(1);
    expect(result.meta.errors[0]).toMatchObject({
      code: "missing-required",
      component: "Stack",
    });
  });

  it("null-required has correct shape", () => {
    const result = parse("root = Stack(null)", schema);
    expect(result.meta.errors).toHaveLength(1);
    expect(result.meta.errors[0]).toMatchObject({
      code: "null-required",
      component: "Stack",
    });
  });
});

// ── array null-dropping ─────────────────────────────────────────────────────

describe("array null-dropping", () => {
  it("drops unresolved refs from children arrays", () => {
    const result = parse('root = Stack([missing, t1])\nt1 = Title("ok")', schema);
    const children = result.root?.props?.children as any[];
    expect(children).toHaveLength(1);
    expect(children[0].typeName).toBe("Title");
  });

  it("drops invalid components (missing required props) from arrays", () => {
    const result = parse('root = Stack([bad, good])\nbad = Title()\ngood = Title("ok")', schema);
    const children = result.root?.props?.children as any[];
    expect(children).toHaveLength(1);
    expect(children[0].props.text).toBe("ok");
  });

  it("drops unknown components from arrays", () => {
    const result = parse('root = Stack([u, t1])\nu = Ghost("x")\nt1 = Title("ok")', schema);
    const children = result.root?.props?.children as any[];
    expect(children).toHaveLength(1);
    expect(children[0].typeName).toBe("Title");
  });

  it("preserves null literals in arrays", () => {
    const result = parse("root = Stack([null, null])", schema);
    const children = result.root?.props?.children as any[];
    expect(children).toEqual([null, null]);
  });

  it("streaming: unresolved refs fill in when defined later", () => {
    const sp = createStreamParser(schema);
    const p1 = sp.push('root = Stack([t1, t2])\nt1 = Title("first")\n');
    expect((p1.root?.props?.children as any[]).length).toBe(1);
    const p2 = sp.push('t2 = Title("second")\n');
    expect((p2.root?.props?.children as any[]).length).toBe(2);
  });
});

// ── orphaned statements ─────────────────────────────────────────────────────

describe("orphaned statements", () => {
  it("detects unreachable statements on complete parse", () => {
    const result = parse(
      'root = Stack([t1])\nt1 = Title("used")\norphan = Title("unused")',
      schema,
    );
    expect(result.meta.orphaned).toContain("orphan");
    expect(result.meta.orphaned).not.toContain("t1");
    expect(result.meta.orphaned).not.toContain("root");
  });

  it("no orphans when all statements are reachable", () => {
    const result = parse('root = Stack([t1, t2])\nt1 = Title("a")\nt2 = Title("b")', schema);
    expect(result.meta.orphaned).toHaveLength(0);
  });

  it("orphaned computed during streaming too", () => {
    const sp = createStreamParser(schema);
    // orphan is defined but not referenced from root
    const p1 = sp.push('root = Stack([t1])\nt1 = Title("a")\norphan = Title("stray")\n');
    expect(p1.meta.orphaned).toContain("orphan");
    expect(p1.meta.orphaned).not.toContain("t1");
  });

  it("detects multiple orphaned statements", () => {
    const result = parse(
      'root = Stack([t1])\nt1 = Title("used")\na = Title("x")\nb = Title("y")',
      schema,
    );
    expect(result.meta.orphaned).toContain("a");
    expect(result.meta.orphaned).toContain("b");
    expect(result.meta.orphaned).toHaveLength(2);
  });

  it("deeply nested refs are not orphaned", () => {
    const result = parse(
      'root = Stack([t1])\nt1 = Table([col], rows)\ncol = Title("Name")\nrows = [["Alice"]]',
      schema,
    );
    expect(result.meta.orphaned).toHaveLength(0);
  });
});

describe("markdown fences and multiline comments in strings", () => {
  it("preserves js markdown fences inside strings", () => {
    const code = 'root = Title("```js\\nconsole.log(\\"Hello World\\");\\n```")';
    const result = parse(code, schema);
    expect(result.meta.errors).toHaveLength(0);
    expect(result.root).not.toBeNull();
    expect(result.root?.props.text).toBe('```js\nconsole.log("Hello World");\n```');
  });

  it("preserves python fenced code blocks inside strings", () => {
    const code = "root = Title(\"```python\\nprint('hi')\\n```\")";
    const result = parse(code, schema);
    expect(result.meta.errors).toHaveLength(0);
    expect(result.root).not.toBeNull();
    expect(result.root?.props.text).toBe("```python\nprint('hi')\n```");
  });

  it("preserves // inside multiline strings", () => {
    const code = `root = Title("
Hello // World
https://example.com/
")`;
    const result = parse(code, schema);
    expect(result.meta.errors).toHaveLength(0);
    expect(result.root).not.toBeNull();
    expect(result.root?.props.text).toBe("\nHello // World\nhttps://example.com/\n");
  });

  it("preserves # inside multiline strings", () => {
    const code = `root = Title("
Hello # World
https://example.com/
")`;
    const result = parse(code, schema);
    expect(result.meta.errors).toHaveLength(0);
    expect(result.root).not.toBeNull();
    expect(result.root?.props.text).toBe("\nHello # World\nhttps://example.com/\n");
  });

  it("does not treat apostrophes as string delimiters when stripping fences", () => {
    const code = `Here's the code:

\`\`\`js
root = Title("hello")
\`\`\``;
    const result = parse(code, schema);
    expect(result.meta.errors).toHaveLength(0);
    expect(result.root).not.toBeNull();
    expect(result.root?.props.text).toBe("hello");
  });
});

describe("streaming fences and comments", () => {
  it("matches a fresh parse of the same text at every chunk", () => {
    const text = `Here's the plan:

\`\`\`openui
root = Stack([a, b]) // layout
# a heading comment
a = Title("x // not a comment") # trailing
b = Title('it''s "#1"')
  // a comment that empties its line
\`\`\`
c = Title("after the fence, ignored")`;
    for (const size of [1, 3]) {
      const sp = createStreamParser(schema);
      for (let i = 0; i < text.length; i += size) {
        const fresh = createStreamParser(schema).push(text.slice(0, i + size));
        expect(sp.push(text.slice(i, i + size))).toEqual(fresh);
      }
    }
  });
});

// ── redefined statement IDs (parse vs stream) ───────────────────────────────

describe("redefined statement IDs", () => {
  const withNewline = `root = Stack([a])
a = Title("x")
a = Title("y")
`;
  const withoutNewline = `root = Stack([a])
a = Title("x")
a = Title("y")`;

  const titleText = (result: ReturnType<typeof parse>) => {
    const children = result.root?.props?.children as any[] | undefined;
    return children?.[0]?.props?.text as string | undefined;
  };

  const pushAll = (
    text: string,
    write: (sp: ReturnType<typeof createStreamParser>, text: string) => void,
  ) => {
    const sp = createStreamParser(schema);
    write(sp, text);
    return titleText(sp.getResult());
  };

  it("parse() last-wins with and without a trailing newline", () => {
    expect(titleText(parse(withNewline, schema))).toBe("y");
    expect(titleText(parse(withoutNewline, schema))).toBe("y");
  });

  it("stream parser last-wins for a single push, matching parse()", () => {
    expect(pushAll(withNewline, (sp, text) => sp.push(text))).toBe("y");
    expect(pushAll(withoutNewline, (sp, text) => sp.push(text))).toBe("y");
  });

  it("stream parser last-wins line-by-line and character-by-character", () => {
    expect(
      pushAll(withNewline, (sp, text) => {
        for (const line of text.split(/(?<=\n)/)) {
          if (line) sp.push(line);
        }
      }),
    ).toBe("y");
    expect(
      pushAll(withNewline, (sp, text) => {
        for (const ch of text) sp.push(ch);
      }),
    ).toBe("y");
    expect(
      pushAll(withoutNewline, (sp, text) => {
        for (const ch of text) sp.push(ch);
      }),
    ).toBe("y");
  });

  it("stream parser last-wins across a two-chunk split", () => {
    expect(
      pushAll("", (sp) => {
        sp.push(`root = Stack([a])\na = Title("x")\n`);
        sp.push(`a = Title("y")\n`);
      }),
    ).toBe("y");
    expect(
      pushAll("", (sp) => {
        sp.push(`root = Stack([a])\na = Title("x")\n`);
        sp.push(`a = Title("y")`);
      }),
    ).toBe("y");
  });

  it("stream parser last-wins via set(), matching the renderer path", () => {
    const sp = createStreamParser(schema);
    expect(titleText(sp.set(withoutNewline))).toBe("y");
  });

  it("does not let an incomplete pending redefinition clobber a completed statement", () => {
    const sp = createStreamParser(schema);
    sp.push(`root = Stack([a])\na = Title("x")\n`);
    expect(titleText(sp.push(`a = Title("y`))).toBe("x");
    expect(titleText(sp.push(`")\n`))).toBe("y");
  });
});

// ── shared references and deep trees ─────────────────────────────────────────

describe("materialize performance", () => {
  it("materializes a statement referenced many times once", () => {
    // a_i = Stack([a_{i+1}, a_{i+1}]): 2^24 leaves if every use were rebuilt.
    const lines = ["root = Stack([a0])"];
    for (let i = 0; i < 24; i++) lines.push(`a${i} = Stack([a${i + 1}, a${i + 1}])`);
    lines.push(`a24 = Title("leaf", "extra")`);
    const result = parse(lines.join("\n"), schema);
    const a0 = (result.root!.props.children as any[])[0];
    expect(a0.props.children[0]).toBe(a0.props.children[1]);
    expect(a0.props.children[0].statementId).toBe("a1");
    // An error inside the shared statement is reported once, attributed to it.
    expect(result.meta.errors).toMatchObject([{ code: "excess-args", statementId: "a24" }]);
  });

  it("keeps each alias's statementId on a shared node", () => {
    const result = parse(`root = Stack([a, b])\nb = a\na = Title("x")`, schema);
    expect((result.root!.props.children as any[]).map((c) => c.statementId)).toEqual(["a", "b"]);
    expect(parse(`root = a\na = Title("x")`, schema).root!.statementId).toBe("root");
  });

  it("propagates hasDynamicProps through a deep chain", () => {
    const chain = (leaf: string) => {
      const lines = ["root = c0"];
      for (let i = 0; i < 500; i++) lines.push(`c${i} = Stack([c${i + 1}])`);
      return parse([...lines, `c500 = Title(${leaf})`].join("\n"), schema).root!;
    };
    expect(chain('"x"').hasDynamicProps).toBe(false);
    expect(chain("$v").hasDynamicProps).toBe(true);
  });
});
