import { describe, expect, it } from "vitest";
import { createParser, createStreamingParser } from "../parser";
import type { LibraryJSONSchema, MaterializeCtx, ValidationError } from "../types";
import { validateSchemaValue } from "../validation";

/**
 * Significant cases for the recursive validator (validateSchemaValue) and the
 * resolveInvalidValue edge rule — one test per behavior family:
 *
 *   1. recursive descent + error reporting (JSON-pointer paths, attribution)
 *   2. the edge rule — default → substitute; required → propagate; optional →
 *      prune; array items always pruned
 *   3. component elements in data slots
 *   4. conservative skips (composites, dynamic values, malformed schemas)
 *   5. streaming gates (required + enum deferred; scalar checks stay on)
 *
 * Each component below exposes the schema-under-test as its FIRST positional
 * arg, so `Comp(<value>)` maps `<value>` straight onto the interesting prop.
 */
const schema: LibraryJSONSchema = {
  $defs: {
    // arg0 → `info`: an object with a required key + typed leaves
    ObjBox: {
      properties: {
        info: {
          type: "object",
          properties: {
            author: { type: "string" },
            views: { type: "number" },
          },
          required: ["author"],
        },
      },
      required: [],
    },
    // arg0 → `rows`: an array whose items are objects with a required key
    ArrBox: {
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              value: { type: "number" },
            },
            required: ["label"],
          },
        },
      },
      required: [],
    },
    // arg0 → `tags`: an array of scalar strings
    TagBox: {
      properties: {
        tags: { type: "array", items: { type: "string" } },
      },
      required: [],
    },
    // arg0 → `status`: an enum leaf
    EnumBox: {
      properties: {
        status: { enum: ["active", "inactive"] },
      },
      required: [],
    },
    // arg0 → `combo`: a composite (anyOf) that must be left unchecked
    AnyBox: {
      properties: {
        combo: { anyOf: [{ type: "string" }, { type: "number" }] },
      },
      required: [],
    },
    // arg0..2 → scalar params for top-level leaf checks
    ScalarBox: {
      properties: {
        title: { type: "string" },
        count: { type: "number" },
        flag: { type: "boolean" },
      },
      required: [],
    },
    // arg0 → `children`: array without `items` — elements are unchecked
    ListBox: {
      properties: { children: { type: "array" } },
      required: [],
    },
    // arg0 → `text`: a plain catalog component used as a nested prop value
    CardBox: {
      properties: { text: { type: "string" } },
      required: [],
    },
    // arg0 → `title`: REQUIRED scalar param — a type mismatch drops the component
    ReqScalar: {
      properties: { title: { type: "string" } },
      required: ["title"],
    },
    // arg0 → `theme`: REQUIRED param with a default — invalid/missing values fall back to it
    DefBox: {
      properties: { theme: { type: "string", default: "dark" } },
      required: ["theme"],
    },
    // arg0 → `children`: a component slot (anyOf of $refs) — membership unchecked
    SlotBox: {
      properties: {
        children: { type: "array", items: { anyOf: [{ $ref: "#/$defs/CardBox" }] } },
      },
      required: [],
    },
    // args → `labels` (REQUIRED data array), `variant` (enum) — mirrors chart signatures
    ChartBox: {
      properties: {
        labels: { type: "array", items: { type: "string" } },
        variant: { enum: ["grouped", "stacked"] },
      },
      required: ["labels"],
    },
    // arg0 → `cfg`: nested keys with defaults at both required and optional edges
    NestDefBox: {
      properties: {
        cfg: {
          type: "object",
          properties: {
            mode: { enum: ["fast", "slow"], default: "fast" },
            retries: { type: "number", default: 3 },
          },
          required: ["mode"],
        },
      },
      required: [],
    },
  },
};

const parser = createParser(schema);

function errorsFor(src: string): ValidationError[] {
  return parser.parse(src).meta.errors;
}

/** Run validateSchemaValue directly against a raw schema fragment. */
function directErrors(value: unknown, s: unknown, partial = false): ValidationError[] {
  const ctx: MaterializeCtx = {
    syms: new Map(),
    cat: undefined,
    errors: [],
    unres: [],
    visited: new Set(),
    partial,
  };
  validateSchemaValue(value, s, "X", "/p", ctx);
  return ctx.errors;
}

describe("recursive descent & error reporting", () => {
  it("accepts valid values and reports violations with JSON-pointer paths + distinct codes", () => {
    expect(errorsFor('root = ObjBox({ author: "ann", views: 3 })')).toEqual([]);
    // wrong leaf type inside an object
    expect(errorsFor('root = ObjBox({ author: "ann", views: "lots" })')[0]).toMatchObject({
      code: "type-mismatch",
      component: "ObjBox",
      path: "/info/views",
    });
    // array item leaf, with element index
    expect(errorsFor('root = ArrBox([{ label: "a", value: "x" }])')[0]).toMatchObject({
      path: "/rows/0/value",
    });
    // missing vs null required keys carry distinct codes
    expect(errorsFor("root = ObjBox({ views: 3 })")[0]).toMatchObject({
      code: "missing-required",
      path: "/info/author",
    });
    expect(errorsFor("root = ObjBox({ author: null, views: 3 })")[0]).toMatchObject({
      code: "null-required",
      path: "/info/author",
    });
  });

  it("reports container-shape mismatches and accumulates independent errors", () => {
    expect(errorsFor('root = ObjBox("hello")')[0].message).toContain(
      "expects object but got string",
    );
    expect(errorsFor("root = TagBox(42)")[0].message).toContain("expects array but got number");
    // an object with dynamic parts is still an object at runtime — flagged
    expect(errorsFor("root = ScalarBox({ a: $x })")[0].message).toContain(
      "expects string but got object",
    );
    // three violations spread over two array elements
    const byPath = errorsFor('root = ArrBox([{ label: 1 }, { value: "x" }])')
      .map((e) => `${e.code}:${e.path}`)
      .sort();
    expect(byPath).toEqual([
      "missing-required:/rows/1/label",
      "type-mismatch:/rows/0/label",
      "type-mismatch:/rows/1/value",
    ]);
    // arg validation and excess-args reporting are independent
    expect(
      errorsFor('root = ScalarBox(1, 1, true, "extra")')
        .map((e) => e.code)
        .sort(),
    ).toEqual(["excess-args", "type-mismatch"]);
  });

  it("messages are self-sufficient and attributed to the defining statement", () => {
    // top-level required violations carry the typed component signature
    expect(errorsFor("root = ReqScalar()")[0].message).toBe(
      'missing required field "/title" — signature: ReqScalar(title*: string)',
    );
    expect(errorsFor('root = ChartBox(null, "grouped")')[0].message).toBe(
      'required field "/labels" cannot be null — signature: ChartBox(labels*: array, variant: "grouped"|"stacked")',
    );
    // unknown components list the catalog
    expect(errorsFor("root = Nope()")[0].message).toContain("Available components: ObjBox, ArrBox");
    // errors point at the statement that defines the component
    expect(
      errorsFor('root = ListBox([inner])\ninner = ObjBox({ author: "ann", views: "lots" })')[0],
    ).toMatchObject({ component: "ObjBox", statementId: "inner" });
  });
});

describe("resolveInvalidValue — the edge rule (default → required → prune)", () => {
  it("prunes invalid values on OPTIONAL edges and ARRAY ITEMS — component survives", () => {
    // nested optional key
    expect(
      parser.parse('root = ObjBox({ author: "ann", views: "lots" })').root?.props.info,
    ).toEqual({ author: "ann" });
    // optional top-level param
    const top = parser.parse("root = ScalarBox(5)");
    expect(top.root).not.toBeNull();
    expect(top.root?.props).not.toHaveProperty("title");
    // optional param holding an unrepairable object (missing required key)
    expect(parser.parse("root = ObjBox({ views: 3 })").root?.props).not.toHaveProperty("info");
    // array items: siblings survive, a required-key violation is absorbed by the item edge
    expect(parser.parse('root = TagBox(["a", 2, "c"])').root?.props.tags).toEqual(["a", "c"]);
    expect(
      parser.parse('root = ArrBox([{ label: "a", value: 1 }, { value: 2 }])').root?.props.rows,
    ).toEqual([{ label: "a", value: 1 }]);
  });

  it("propagates through REQUIRED edges: parent pruned at an optional edge, or component dropped", () => {
    // info.author (required) invalid → info invalid → info optional → pruned
    const nested = parser.parse('root = ObjBox({ author: { first: "a" }, views: 3 })');
    expect(nested.root).not.toBeNull();
    expect(nested.root?.props).not.toHaveProperty("info");
    // required param invalid with no default → component drops
    expect(parser.parse("root = ReqScalar(5)").root).toBeNull();
  });

  it("substitutes schema defaults at every edge; absent/null required keys fill silently", () => {
    // top-level required param: default rescues an invalid value (error kept) and a missing one (silent)
    const def = parser.parse("root = DefBox(5)");
    expect(def.root?.props.theme).toBe("dark");
    expect(def.meta.errors).toHaveLength(1);
    expect(parser.parse("root = DefBox()").meta.errors).toEqual([]);
    // top-level optional param: default wins over pruning (error kept)
    const opt = parser.parse('root = NestDefBox({ mode: "warp", retries: 1 })');
    expect(opt.root?.props.cfg).toEqual({ mode: "fast", retries: 1 });
    expect(opt.meta.errors[0]).toMatchObject({ code: "type-mismatch", path: "/cfg/mode" });
    // nested optional key with default
    expect(
      parser.parse('root = NestDefBox({ mode: "slow", retries: "many" })').root?.props.cfg,
    ).toEqual({ mode: "slow", retries: 3 });
    // absent and null required keys fill from defaults without an error
    const absent = parser.parse("root = NestDefBox({ retries: 2 })");
    expect(absent.root?.props.cfg).toEqual({ mode: "fast", retries: 2 });
    expect(absent.meta.errors).toEqual([]);
    const nulled = parser.parse("root = NestDefBox({ mode: null, retries: 2 })");
    expect(nulled.root?.props.cfg).toEqual({ mode: "fast", retries: 2 });
    expect(nulled.meta.errors).toEqual([]);
  });
});

describe("components in data slots", () => {
  it("elements in data slots follow the edge rule: drop on required, prune on optional/items", () => {
    // hbc = HorizontalBarChart(Card([]), [], "grouped") — the motivating case.
    const dropped = parser.parse('root = ChartBox(CardBox("x"), "grouped")');
    expect(dropped.root).toBeNull();
    expect(dropped.meta.errors[0].message).toContain('expects array but got component "CardBox"');
    // optional enum leaf → prop pruned
    const pruned = parser.parse('root = ChartBox(["a"], CardBox("x"))');
    expect(pruned.root?.props).not.toHaveProperty("variant");
    expect(pruned.meta.errors[0].message).toContain("expects a literal value but got component");
    // data-array item → item pruned, siblings survive
    expect(parser.parse('root = TagBox(["a", CardBox("x"), "b"])').root?.props.tags).toEqual([
      "a",
      "b",
    ]);
  });

  it("component slots ($ref/anyOf) stay unchecked; a misplaced component's own args still validate", () => {
    const slot = parser.parse('root = SlotBox([CardBox("hi"), EnumBox("active")])');
    expect(slot.meta.errors).toEqual([]);
    expect((slot.root?.props.children as unknown[]).length).toBe(2);
    // both the position error and the component's own arg error surface
    const errors = errorsFor("root = ObjBox({ author: CardBox(9) })");
    expect(errors).toHaveLength(2);
    expect(errors.find((e) => e.component === "CardBox")).toMatchObject({ path: "/text" });
    expect(errors.find((e) => e.component === "ObjBox")).toMatchObject({ path: "/info/author" });
  });
});

describe("conservative skips", () => {
  it("skips dynamic values, composites, null/omitted args, and extra keys", () => {
    expect(errorsFor('root = TagBox(["a", $x])')).toEqual([]); // $var resolves at runtime
    expect(errorsFor('root = ObjBox({ author: "a", views: Sum([1, 2]) })')).toEqual([]); // builtin
    expect(errorsFor("root = AnyBox({ anything: true })")).toEqual([]); // anyOf composite
    expect(errorsFor("root = ObjBox(null)")).toEqual([]); // absence is the parent's concern
    expect(errorsFor("root = ObjBox()")).toEqual([]);
    expect(errorsFor('root = ObjBox({ author: "a", bonus: 99 })')).toEqual([]); // undeclared keys
    expect(errorsFor('root = ListBox([1, "a", true])')).toEqual([]); // array without `items`
  });

  it("skips malformed/uncheckable schemas and applies documented leaf edges (direct)", () => {
    expect(directErrors(5, undefined)).toEqual([]);
    expect(directErrors(5, "string")).toEqual([]);
    expect(directErrors(5, { $ref: "#/$defs/Thing" })).toEqual([]);
    expect(directErrors(5, { oneOf: [{ type: "string" }] })).toEqual([]);
    expect(directErrors([5], { type: "array", items: [{ type: "string" }] })).toEqual([]); // tuple
    expect(directErrors("x", { type: "date" })).toEqual([]); // unknown type keyword
    expect(directErrors({}, { type: "object", required: "author" })).toEqual([]); // non-array required
    // ...but `required` works even without `properties`
    expect(directErrors({}, { type: "object", required: ["a"] })[0]).toMatchObject({
      code: "missing-required",
    });
    // leaf edges: integer ≈ number (floats pass), const ≈ single-value enum,
    // non-scalar values never judged against enums
    expect(directErrors(1.5, { type: "integer" })).toEqual([]);
    expect(directErrors("3", { type: "integer" })).toHaveLength(1);
    expect(directErrors("loose", { const: "fixed" })[0].message).toContain('one of ["fixed"]');
    expect(directErrors({ a: 1 }, { enum: ["active"] })).toEqual([]);
  });
});

describe("streaming gates", () => {
  it("defers required-key and enum checks while partial, then reports them on completion", () => {
    const req = createStreamingParser(schema);
    expect(req.push("root = ObjBox({ views: 3 ").meta.errors).toEqual([]);
    expect(req.push("})\n").meta.errors[0]).toMatchObject({
      code: "missing-required",
      path: "/info/author",
      statementId: "root",
    });
    const en = createStreamingParser(schema);
    expect(en.push('root = EnumBox("bogus" ').meta.errors).toEqual([]);
    expect(en.push(")\n").meta.errors[0]).toMatchObject({ path: "/status" });
  });

  it("keeps scalar type checks on mid-stream (only structure and enums defer)", () => {
    const sp = createStreamingParser(schema);
    const res = sp.push('root = ObjBox({ author: "a", views: "lots" ');
    expect(res.meta.incomplete).toBe(true);
    expect(res.meta.errors.find((e) => e.code === "type-mismatch")).toMatchObject({
      path: "/info/views",
    });
    // same gating verified directly on a partial ctx
    expect(directErrors({}, { type: "object", required: ["a"] }, true)).toEqual([]);
    expect(directErrors("act", { enum: ["active"] }, true)).toEqual([]);
    expect(directErrors(5, { type: "string" }, true)).toHaveLength(1);
  });
});
