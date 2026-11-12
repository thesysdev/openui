// @vitest-environment jsdom
import type { OpenUIError } from "@openuidev/lang-core";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent } from "./library";
import { Renderer } from "./Renderer";

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

it("warns once with every error and the reliability docs link when onError is not passed", () => {
  const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
  try {
    const container = document.createElement("div");
    const root = createRoot(container);
    act(() =>
      root.render(createElement(Renderer, { response: 'title = Title("Orders")', library })),
    );
    act(() => root.unmount());
    expect(spy).toHaveBeenCalledTimes(1);
    const message = String(spy.mock.calls[0]?.[0]);
    expect(message).toContain("[openui] Rendered with 1 error:");
    expect(message).toContain("parser/no-root:");
    expect(message).toContain("https://www.openui.com/docs/openui-lang/reliability");
  } finally {
    spy.mockRestore();
  }
});
