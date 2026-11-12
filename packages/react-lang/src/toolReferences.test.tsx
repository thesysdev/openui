// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import {
  action,
  createLibrary,
  defineComponent,
  defineFunction,
  useTriggerAction,
  type OpenUIError,
} from "./index";
import { Renderer } from "./Renderer";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const Button = defineComponent({
  name: "Button",
  description: "Run",
  props: z.object({ action: action() }),
  component: ({ props }) => {
    const trigger = useTriggerAction();
    return createElement(
      "button",
      { onClick: () => void trigger("Run", undefined, props.action) },
      "Run",
    );
  },
});
const multiply = defineFunction({
  name: "Multiply",
  description: "Multiply two values",
  params: z.object({ value: z.number(), factor: z.number() }),
  returns: z.number(),
  fn: ({ value, factor }) => value * factor,
});
const library = createLibrary({ root: "Button", components: [Button], functions: [multiply] });
async function harness() {
  const node = document.createElement("div"),
    root = createRoot(node);
  const save = vi.fn(async (_args: Record<string, unknown>) => ({ saved: true }));
  let errors: OpenUIError[] = [];
  return {
    save,
    errors: () => errors,
    render: async (response: string, isStreaming = false) => {
      await act(async () =>
        root.render(
          createElement(Renderer, {
            library,
            response,
            isStreaming,
            toolProvider: { save },
            onError: (e) => {
              errors = e;
            },
            publishObservability: false,
          }),
        ),
      );
    },
    click: async () => {
      await act(async () => node.querySelector("button")!.click());
    },
    close: async () => {
      await act(async () => root.unmount());
    },
  };
}
describe.each(["Query", "Mutation"])("%s referenced values", (kind) => {
  it("passes forward aliases and nested values to the real tool provider", async () => {
    const t = await harness();
    try {
      await t.render(
        `root=Button(@Run(job))\njob=${kind}(tool,args)\ntool="save"\nargs={amount:amount,nested:[alias]}\namount=42\nalias=amount`,
      );
      if (kind === "Mutation") {
        expect(t.save).not.toHaveBeenCalled();
        await t.click();
      }
      expect(t.save).toHaveBeenCalledWith({ amount: 42, nested: [42] });
      expect(t.errors()).toEqual([]);
    } finally {
      await t.close();
    }
  });
  it("reads current state through aliases and refreshes Query when it changes", async () => {
    const t = await harness();
    try {
      await t.render(
        `root=Button(${kind === "Query" ? "@Set($n,3)" : "Action([@Set($n,3),@Run(job)])"})\n$n=2\njob=${kind}("save",args)\nargs={amount:amount}\namount=@Multiply($n,10)`,
      );
      if (kind === "Query") expect(t.save).toHaveBeenLastCalledWith({ amount: 20 });
      await t.click();
      expect(t.save).toHaveBeenLastCalledWith({ amount: 30 });
    } finally {
      await t.close();
    }
  });
  it("waits for streamed forward references, reports errors, and recovers after correction", async () => {
    const t = await harness();
    const prefix = `root=Button(@Run(job))\njob=${kind}("save",{amount:amount})\n`;
    try {
      await t.render(prefix, true);
      await t.render(prefix + "amount=@Missing(42)", true);
      expect(t.errors()).toEqual([]);
      expect(t.save).not.toHaveBeenCalled();
      await t.render(prefix + "amount=@Missing(42)");
      expect(t.errors()).toEqual([
        expect.objectContaining({ code: "unknown-function", statementId: "amount" }),
      ]);
      if (kind === "Mutation") await t.click();
      expect(t.save).toHaveBeenLastCalledWith({ amount: null });
      await t.render(prefix + "amount=@Sum([40,2])");
      expect(t.errors()).toEqual([]);
      if (kind === "Mutation") await t.click();
      expect(t.save).toHaveBeenLastCalledWith({ amount: 42 });
    } finally {
      await t.close();
    }
  });
});
