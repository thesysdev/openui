// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent, defineFunction } from "./index";
import { Renderer } from "./Renderer";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Text = defineComponent({
  name: "Text",
  props: z.object({ value: z.string() }),
  description: "Shows a value",
  component: ({ props }) => createElement("span", null, props.value),
});
const percent = defineFunction({
  name: "Percent",
  description: "Formats part / total as a percentage",
  params: z.object({ part: z.number(), total: z.number() }),
  returns: z.string(),
  fn: ({ part, total }) => `${((part / total) * 100).toFixed(1)}%`,
});
const library = createLibrary({ root: "Text", components: [Text], functions: [percent] });

it("Renderer evaluates library function calls", async () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  const response = "root = Text(@Percent(763, 1000))";
  await act(async () => root.render(createElement(Renderer, { library, response })));
  expect(container.textContent).toBe("76.3%");
  await act(async () => root.unmount());
});
