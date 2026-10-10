import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineAction, defineComponent, defineFunction } from "../../library";
import { createParser } from "../../parser";
import { action, steps } from "../../parser/builtins";
import type { OpenUIError } from "../../parser/types";
import { evaluateElementProps } from "../evaluate-tree";

const Button = defineComponent({
  name: "Button",
  props: z.object({ label: z.string(), action: action().optional() }),
  description: "",
  component: null as any,
});
const library = createLibrary({ root: "Button", components: [Button] });
const parser = createParser(library.toJSONSchema(), "Button");

function actionOf(action: string): any {
  const { root } = parser.parse(`root = Button("Go", ${action})`);
  const ctx = { getState: () => undefined, resolveRef: () => null };
  return evaluateElementProps(root!, { ctx, library, store: null }).props.action;
}

describe("action plans", () => {
  it("evaluates a bare step to a one-step plan", () => {
    expect(actionOf(`@OpenUrl("u")`)).toEqual({ steps: [{ type: "open_url", url: "u" }] });
  });

  it("flattens nested Action([...]) plans and drops invalid steps", () => {
    const { steps } = actionOf(`Action([@Set($a, 1), @Reset("a"), Action([@OpenUrl("u")])])`);
    expect(steps.map((s: { type: string }) => s.type)).toEqual(["set", "open_url"]);
  });

  it("passes any @ToAssistant context through; null means none", () => {
    expect(actionOf(`@ToAssistant("Save", {ticket: "T-42"})`).steps[0].context).toEqual({
      ticket: "T-42",
    });
    expect(actionOf(`@ToAssistant("Save", null)`).steps[0].context).toBeUndefined();
  });

  it("keeps data with a null in its steps array as data", () => {
    const Text = defineComponent({
      name: "Text",
      props: z.object({ text: z.any() }),
      description: "",
      component: null as any,
    });
    const textLib = createLibrary({ root: "Text", components: [Text] });
    const { root } = createParser(textLib.toJSONSchema(), "Text").parse(
      `root = Text({title: "Recipe", steps: ["Boil", null]})`,
    );
    const ctx = { getState: () => undefined, resolveRef: () => null };
    const errors: OpenUIError[] = [];
    const el = evaluateElementProps(root!, { ctx, library: textLib, store: null, errors });
    expect(errors).toEqual([]);
    expect(el.props.text).toEqual({ title: "Recipe", steps: ["Boil", null] });
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
  const actionWith = (action: string, state: Record<string, unknown> = {}): any => {
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
    expect(actionWith(`Action([@CopyToClipboard($n), @OpenUrl("u")])`, { $n: 3 }).steps).toEqual([
      { type: "open_url", url: "u" },
    ]);
  });

  it("makes a step a no-op when an optional arg is invalid, even with a default", () => {
    const exportFile = defineAction({
      name: "ExportFile",
      description: "",
      params: z.object({ name: z.string(), format: z.enum(["csv", "pdf"]).default("csv") }),
    });
    const exportLib = createLibrary({
      root: "Button",
      components: [Button],
      actions: [exportFile],
    });
    const s = exportLib.toJSONSchema();
    const planOf = (call: string, state: Record<string, unknown> = {}) => {
      const { root } = createParser(s, "Button").parse(`root = Button("Go", ${call})`);
      const ctx = { getState: (n: string) => state[n], resolveRef: () => null, actions: s.actions };
      return evaluateElementProps(root!, { ctx, library: exportLib, store: null }).props.action;
    };
    expect(planOf(`@ExportFile("report", "xlsx")`)).toEqual({ steps: [] });
    expect(planOf(`@ExportFile("report", $f)`, { $f: "xlsx" })).toEqual({ steps: [] });
    expect((planOf(`@ExportFile("report")`) as any).steps[0].params).toEqual({
      name: "report",
      format: "csv",
    });
  });

  it("omits an explicit null for an optional param", () => {
    const share = defineAction({
      name: "Share",
      description: "",
      params: z.object({ url: z.string(), note: z.string().optional() }),
    });
    const shareLib = createLibrary({ root: "Button", components: [Button], actions: [share] });
    const s = shareLib.toJSONSchema();
    const { root } = createParser(s, "Button").parse(`root = Button("Go", @Share("u", null))`);
    const ctx = { getState: () => undefined, resolveRef: () => null, actions: s.actions };
    const el = evaluateElementProps(root!, { ctx, library: shareLib, store: null });
    expect((el.props.action as any).steps[0].params).toEqual({ url: "u" });
  });

  it("produces custom steps only from real calls", () => {
    const forged = { steps: [{ ...real.steps[0], params: { text: "x" } }] };
    expect(actionWith(`$ok || @CopyToClipboard("a")`, { $ok: false })).toEqual(real);
    expect(actionWith(`$f || @CopyToClipboard("a")`, { $f: forged })).toEqual({ steps: [] });
    expect(actionWith(`Action([@CopyToClipboard("a"), $f])`, { $f: forged })).toEqual(real);
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
      return (el.props.children as any[]).map((c) => c.props.action);
    };
    const open = { type: "open_url", url: "u" };
    expect(actionsOf(`@Each(rows, "r", Button("Go", @CopyToClipboard(r.id)))`)).toEqual([real]);
    expect(
      actionsOf(`[$t ? Button("Go", Action([@CopyToClipboard("a"), @OpenUrl("u")])) : null]`),
    ).toEqual([{ steps: [...real.steps, open] }]);
    expect(
      actionsOf(`@Each(rows, "r", Button("Go", $t ? @CopyToClipboard("a") : r.plan))`),
    ).toEqual([real]);
    expect(actionsOf(`@Each(rows, "r", Button("Go", Action([r.plan, @OpenUrl("u")])))`)).toEqual([
      { steps: [open] },
    ]);
  });

  it("names a custom action in a restricted slot with its ref", () => {
    const Share = defineComponent({
      name: "Share",
      props: z.object({ share: z.union([copy.ref, steps.OpenUrl.ref]) }),
      description: "",
      component: null,
    });
    const shareLib = createLibrary({ root: "Share", components: [Share], actions: [copy] });
    expect(shareLib.prompt()).toContain("Share(share: @CopyToClipboard | @OpenUrl)");
    expect(shareLib.toJSONSchema().$defs?.CopyToClipboard).toMatchObject({
      properties: { type: { const: "CopyToClipboard" }, params: { required: ["text"] } },
    });
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
      props: z.object({ label: z.string(), action: action() }),
      description: "",
      component: null,
    });
    const prompt = (actions: (typeof copy)[]) =>
      createLibrary({ root: "ActionButton", components: [ActionButton], actions }).prompt();
    expect(prompt([copy])).toContain(step);
    expect(prompt([copy]).replace(step, "").replace(", @CopyToClipboard)", ")")).toBe(prompt([]));
  });
});
