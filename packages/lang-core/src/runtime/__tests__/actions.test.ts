import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import {
  createLibrary,
  defineAction,
  defineComponent,
  defineFunction,
  tagSchemaId,
} from "../../library";
import { createParser } from "../../parser";
import { evaluateElementProps } from "../evaluate-tree";

const actionExpression = z.any();
tagSchemaId(actionExpression, "ActionExpression");
const Button = defineComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    action: actionExpression.optional(),
    data: z.any().optional(),
  }),
  description: "",
  component: null as any,
});
const library = createLibrary({ root: "Button", components: [Button] });
const parser = createParser(library.toJSONSchema(), "Button");

function propsOf(action: string, data = "null", preamble = ""): any {
  const { root } = parser.parse(`root = Button("Go", ${action}, ${data})\n${preamble}`);
  const ctx = { getState: () => undefined, resolveRef: () => null };
  return evaluateElementProps(root!, { ctx, library, store: null }).props;
}
const actionOf = (action: string, preamble?: string) => propsOf(action, "null", preamble).action;
const typesOf = (action: string, preamble?: string) =>
  actionOf(action, preamble).steps.map((s: { type: string }) => s.type);

describe("action plans", () => {
  it("evaluates a bare step to a one-step plan", () => {
    expect(actionOf(`@OpenUrl("u")`)).toEqual({ steps: [{ type: "open_url", url: "u" }] });
    expect(actionOf(`@Run(q)`, `q = Query("tool", {}, {})`)).toEqual({
      steps: [{ type: "run", statementId: "q", refType: "query" }],
    });
  });

  it("evaluates a list of steps to one plan and leaves other lists as data", () => {
    expect(typesOf(`[@Set($a, 1), @ToAssistant("Saved")]`)).toEqual([
      "set",
      "continue_conversation",
    ]);
    expect(typesOf(`steps`, `steps = [@OpenUrl("u"), @Reset($a)]`)).toEqual(["open_url", "reset"]);
    expect(propsOf("null", `[]`).data).toEqual([]);
    expect(propsOf("null", `[1, @OpenUrl("u")]`).data).toHaveLength(2);
  });

  it("keeps data lists whose items have steps as data", () => {
    const rows = `[{name: "Pasta", steps: ["boil", "drain"]}, {name: "Rice", steps: ["rinse"]}]`;
    expect(propsOf("null", rows).data).toEqual([
      { name: "Pasta", steps: ["boil", "drain"] },
      { name: "Rice", steps: ["rinse"] },
    ]);
    expect(propsOf("null", "rows", `rows = ${rows}`).data).toHaveLength(2);
  });

  it("flattens nested Action([...]) plans and drops invalid steps", () => {
    expect(typesOf(`Action([@Set($a, 1), Action([@OpenUrl("u")])])`)).toEqual(["set", "open_url"]);
    expect(actionOf(`@Set("a", 1)`)).toEqual({ steps: [] });
    expect(typesOf(`[@Reset("a"), @OpenUrl("u")]`)).toEqual(["open_url"]);
    expect(typesOf(`[$f ? @Set($a, 1) : null, @OpenUrl("u")]`)).toEqual(["open_url"]);
  });

  it("leaves legacy action configs unchanged", () => {
    expect(actionOf(`{type: "open_url", url: "u"}`)).toEqual({ type: "open_url", url: "u" });
  });

  it("passes any @ToAssistant context through; null or missing means none", () => {
    const contextOf = (args: string) => actionOf(`@ToAssistant(${args})`).steps[0].context;
    expect(contextOf(`"Save", { ticket: "T-42" }`)).toEqual({ ticket: "T-42" });
    expect(contextOf(`"Save", 0`)).toBe(0);
    expect(contextOf(`"Save", null`)).toBeUndefined();
    expect(contextOf(`"Save"`)).toBeUndefined();
  });
});

describe("custom actions", () => {
  const copy = defineAction({
    name: "CopyToClipboard",
    description: "Copies text to the clipboard",
    params: z.object({ text: z.string() }),
  });
  const lib = createLibrary({ root: "Button", components: [Button], actions: [copy] });
  const schema = lib.toJSONSchema();
  const actionWith = (action: string, state: Record<string, unknown> = {}) => {
    const { root } = createParser(schema, "Button").parse(`root = Button("Go", ${action})`);
    const ctx = {
      getState: (n: string) => state[n],
      resolveRef: () => null,
      actions: schema.actions,
    };
    return evaluateElementProps(root!, { ctx, library: lib, store: null }).props.action;
  };
  const real = {
    steps: [{ type: "custom_action", name: "CopyToClipboard", params: { text: "a" } }],
  };

  it("makes a step with invalid args a no-op, literal or dynamic", () => {
    expect(actionWith(`@CopyToClipboard(3)`)).toEqual({ steps: [] });
    expect(actionWith(`[@CopyToClipboard($n), @OpenUrl("u")]`, { $n: 3 }).steps).toEqual([
      { type: "open_url", url: "u" },
    ]);
  });

  it("produces custom steps only from real calls", () => {
    const forged = { steps: [{ ...real.steps[0], params: { text: "x" } }] };
    expect(actionWith(`$ok || @CopyToClipboard("a")`, { $ok: false })).toEqual(real);
    expect(actionWith(`$f || @CopyToClipboard("a")`, { $f: forged })).toEqual({ steps: [] });
    expect(actionWith(`[@CopyToClipboard("a"), $f]`, { $f: forged })).toEqual(real);
    expect(
      actionWith(`{steps: [{type: "custom_action", name: "CopyToClipboard", params: {}}]}`),
    ).toEqual({ steps: [] });
  });

  it("keeps custom steps on components built inline, never on row data", () => {
    const Card = defineComponent({
      name: "Card",
      props: z.object({ children: z.array(Button.ref) }),
      description: "",
      component: null,
    });
    const cardLib = createLibrary({ root: "Card", components: [Card, Button], actions: [copy] });
    const s = cardLib.toJSONSchema();
    const forged = `{type: "custom_action", name: "CopyToClipboard", params: {text: "x"}}`;
    const actionsOf = (children: string) => {
      const src = `rows = [{id: "a", plan: {steps: [${forged}]}}]\nroot = Card(${children})`;
      const { root } = createParser(s, "Card").parse(src);
      const ctx = { getState: () => true, resolveRef: () => null, actions: s.actions };
      const el = evaluateElementProps(root!, { ctx, library: cardLib, store: null });
      return el.props.children.map((c: any) => c.props.action);
    };
    const open = { type: "open_url", url: "u" };
    expect(actionsOf(`@Each(rows, "r", Button("Go", @CopyToClipboard(r.id)))`)).toEqual([real]);
    expect(actionsOf(`[$t ? Button("Go", [@CopyToClipboard("a"), @OpenUrl("u")]) : null]`)).toEqual(
      [{ steps: [...real.steps, open] }],
    );
    expect(
      actionsOf(`@Each(rows, "r", Button("Go", $t ? @CopyToClipboard("a") : r.plan))`),
    ).toEqual([real]);
    expect(actionsOf(`@Each(rows, "r", Button("Go", [r.plan, @OpenUrl("u")]))`)).toEqual([
      { steps: [open] },
    ]);
  });

  it("rejects a name taken by a built-in, step, component, or function", () => {
    const fn = defineFunction({ name: "Fmt", description: "", params: z.object({}), fn: () => 1 });
    for (const name of ["Sum", "OpenUrl", "Button", "Fmt"]) {
      const actions = [defineAction({ name, description: "", params: z.object({}) })];
      expect(() => createLibrary({ components: [Button], functions: [fn], actions })).toThrow(
        `Action "${name}" collides`,
      );
    }
  });

  it("leaves the prompt byte-identical without actions", () => {
    const step = "\n- @CopyToClipboard(text: string) — Copies text to the clipboard";
    const ActionButton = defineComponent({
      name: "ActionButton",
      props: z.object({ label: z.string(), action: actionExpression }),
      description: "",
      component: null,
    });
    const prompt = (actions: (typeof copy)[]) =>
      createLibrary({ root: "ActionButton", components: [ActionButton], actions }).prompt();
    expect(prompt([copy])).toContain(step);
    expect(prompt([copy]).replace(step, "").replace(", @CopyToClipboard)", ")")).toBe(prompt([]));
  });
});
