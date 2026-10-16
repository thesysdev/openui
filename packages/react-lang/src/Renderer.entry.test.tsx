// @vitest-environment jsdom
import type { OpenUIError } from "@openuidev/lang-core";
import { action } from "@openuidev/lang-core";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { z } from "zod/v4";
import { useTriggerAction } from "./context";
import { useStateField } from "./hooks/useStateField";
import { createLibrary, defineComponent } from "./library";
import { Renderer } from "./Renderer";
import { reactive } from "./runtime";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Card = defineComponent({
  name: "Card",
  props: z.object({ children: z.array(z.any()) }),
  description: "Card",
  component: ({ props, renderNode }) =>
    createElement("section", null, renderNode(props.children) as never),
});
const Title = defineComponent({
  name: "Title",
  props: z.object({ text: z.string() }),
  description: "Title",
  component: ({ props }) => createElement("h1", null, props.text),
});
const library = createLibrary({ root: "Card", components: [Card, Title] });

function render(response: string) {
  const errors: OpenUIError[][] = [];
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() =>
    root.render(createElement(Renderer, { response, library, onError: (e) => errors.push(e) })),
  );
  const text = container.textContent;
  act(() => root.unmount());
  return { codes: (errors.at(-1) ?? []).map((e) => e.code), text };
}

it("reports no-root instead of parse-failed, and renders a ternary entry", () => {
  expect(render('title = Title("Orders")')).toEqual({
    codes: ["no-root"],
    text: "",
  });
  expect(render('$wide = false\nroot = $wide ? a : b\na = Card([])\nb = Title("narrow")')).toEqual({
    codes: [],
    text: "narrow",
  });
});

it.each([
  ["$note", "edited", "second edit"],
  ["$note = $value", "edited", "second edit"],
  ['$note = $value + "!"', "edited!", "second edit!"],
])(
  "keeps the %s input binding editable across ternary root switches",
  async (binding, first, second) => {
    let edit: (value: string) => void = () => {
      throw new Error("Input has not rendered");
    };
    const Input = defineComponent({
      name: "Input",
      description: "",
      props: z.object({ value: reactive(z.string()) }),
      component: ({ props }) => {
        const field = useStateField("note", props.value);
        edit = field.setValue;
        return <input value={String(field.value ?? "")} readOnly />;
      },
    });
    const Button = defineComponent({
      name: "Button",
      description: "",
      props: z.object({ action: action() }),
      component: ({ props }) => {
        const trigger = useTriggerAction();
        return (
          <button onClick={() => void trigger("Switch", undefined, props.action)}>Switch</button>
        );
      },
    });
    const library = createLibrary({ root: "Card", components: [Card, Title, Input, Button] });
    const response = `root = $open ? a : b
$open = true
$note = "default"
a = Card([Title("A"), Input(${binding}), Button(@Set($open, false))])
b = Card([Title("B"), Input(${binding}), Button(@Set($open, true))])`;
    const container = document.createElement("div");
    const root = createRoot(container);
    const states: Record<string, unknown>[] = [];
    act(() =>
      root.render(
        <Renderer
          library={library}
          response={response}
          isStreaming={false}
          onStateUpdate={(s) => states.push(s)}
        />,
      ),
    );
    try {
      expect(container.querySelector("input")?.value).toBe("default");
      act(() => edit("edited"));
      expect(container.querySelector("input")?.value).toBe(first);
      await act(async () => container.querySelector("button")?.click());
      expect(container.querySelector("h1")?.textContent).toBe("B");
      expect(container.querySelector("input")?.value).toBe(first);
      act(() => edit("second edit"));
      expect(container.querySelector("input")?.value).toBe(second);
      await act(async () => container.querySelector("button")?.click());
      expect(container.querySelector("h1")?.textContent).toBe("A");
      expect(container.querySelector("input")?.value).toBe(second);
      expect(states.at(-1)).toMatchObject({ $note: second, $open: true });
    } finally {
      act(() => root.unmount());
    }
  },
);
