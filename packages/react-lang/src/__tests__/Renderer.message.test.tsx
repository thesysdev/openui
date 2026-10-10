// @vitest-environment jsdom
import { buildMessage } from "@openuidev/lang-core";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent } from "../library";
import { Renderer } from "../Renderer";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Text = defineComponent({
  name: "Text",
  props: z.object({ value: z.string() }),
  description: "Text",
  component: ({ props }) => createElement("p", null, props.value),
});
const library = createLibrary({ root: "Text", components: [Text] });

it("renders the content of a stored message", () => {
  const response = buildMessage({ content: 'root = Text("hi")', context: [{}], end: true });
  const el = document.createElement("div");
  act(() => createRoot(el).render(createElement(Renderer, { response, library })));
  expect(el.textContent).toBe("hi");
});
