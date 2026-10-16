// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { useTriggerAction } from "./context";
import { createLibrary, defineComponent } from "./library";
import { Renderer } from "./Renderer";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const Text = defineComponent({
  name: "Text",
  description: "Query result",
  props: z.object({ value: z.string() }),
  component: ({ props }) => createElement("span", null, props.value),
});
const Button = defineComponent({
  name: "Button",
  description: "Change query state",
  props: z.object({ action: z.any() }),
  component: ({ props }) => {
    const trigger = useTriggerAction();
    return createElement(
      "button",
      { onClick: () => void trigger("Next", undefined, props.action) },
      "Next",
    );
  },
});
const Card = defineComponent({
  name: "Card",
  description: "Query and controls",
  props: z.object({ children: z.array(z.union([Text.ref, Button.ref])) }),
  component: ({ props, renderNode }) => createElement("div", null, renderNode(props.children)),
});
const library = createLibrary({ root: "Card", components: [Card, Text, Button] });
const program = (amount: string) =>
  `root = Card([Text("Amount: " + q.amount), Button(@Set($qty, $qty + 1))])\n$qty = 2\nq = Query("lookup", {amount: ${amount}}, {amount: 0})`;

describe("Query initialization", () => {
  it.each([
    { name: "literal argument", expression: "2", persisted: undefined, initial: 2, next: 2 },
    { name: "declared state", expression: "$qty", persisted: undefined, initial: 2, next: 3 },
    { name: "persisted state", expression: "$qty", persisted: { $qty: 5 }, initial: 5, next: 6 },
    {
      name: "computed argument",
      expression: "$qty * 10",
      persisted: undefined,
      initial: 20,
      next: 30,
    },
  ])(
    "fetches once for $name and preserves state-driven refetching",
    async ({ expression, persisted, initial, next }) => {
      const container = document.createElement("div");
      const root = createRoot(container);
      const lookup = vi.fn(async (args: Record<string, unknown>) => args);
      try {
        await act(async () =>
          root.render(
            createElement(Renderer, {
              library,
              response: program(expression),
              isStreaming: false,
              initialState: persisted,
              toolProvider: { lookup },
              publishObservability: false,
            }),
          ),
        );
        expect(lookup.mock.calls).toEqual([[{ amount: initial }]]);
        expect(container.textContent).toContain(`Amount: ${initial}`);
        await act(async () => container.querySelector("button")!.click());
        expect(lookup.mock.calls).toEqual(
          initial === next ? [[{ amount: initial }]] : [[{ amount: initial }], [{ amount: next }]],
        );
        expect(container.textContent).toContain(`Amount: ${next}`);
      } finally {
        await act(async () => root.unmount());
      }
    },
  );

  it("deduplicates the initial request while the tool is still pending", async () => {
    const root = createRoot(document.createElement("div"));
    let finish: (value: { amount: number }) => void = () => {};
    const result = new Promise<{ amount: number }>((resolve) => {
      finish = resolve;
    });
    const lookup = vi.fn(() => result);
    try {
      await act(async () =>
        root.render(
          createElement(Renderer, {
            library,
            response: program("$qty"),
            isStreaming: false,
            toolProvider: { lookup },
            publishObservability: false,
          }),
        ),
      );
      expect(lookup.mock.calls).toHaveLength(1);
    } finally {
      await act(async () => {
        finish({ amount: 2 });
      });
      await act(async () => root.unmount());
    }
  });

  it("waits for streaming to finish before fetching initialized state once", async () => {
    const root = createRoot(document.createElement("div"));
    const lookup = vi.fn(async (args: Record<string, unknown>) => args);
    const props = {
      library,
      response: program("$qty"),
      toolProvider: { lookup },
      publishObservability: false,
    };
    try {
      await act(async () => root.render(createElement(Renderer, { ...props, isStreaming: true })));
      expect(lookup).not.toHaveBeenCalled();
      await act(async () => root.render(createElement(Renderer, { ...props, isStreaming: false })));
      expect(lookup.mock.calls).toEqual([[{ amount: 2 }]]);
    } finally {
      await act(async () => root.unmount());
    }
  });
});
