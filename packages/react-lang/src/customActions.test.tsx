// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod/v4";
import type { ActionEvent } from "./index";
import {
  createLibrary,
  defineAction,
  defineComponent,
  tagSchemaId,
  useTriggerAction,
} from "./index";
import { Renderer } from "./Renderer";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const actionExpression = z.any();
tagSchemaId(actionExpression, "ActionExpression");
const Button = defineComponent({
  name: "Button",
  props: z.object({ label: z.string(), action: actionExpression.optional() }),
  description: "A button",
  component: ({ props }) => {
    const trigger = useTriggerAction();
    return createElement("button", {
      onClick: () => trigger(props.label, undefined, props.action),
    });
  },
});
const copy = defineAction({
  name: "CopyToClipboard",
  description: "Copies text to the clipboard",
  params: z.object({ text: z.string(), format: z.string().default("plain") }),
});
const library = createLibrary({ root: "Button", components: [Button], actions: [copy] });

/** Clicks `Button("Go", <action>)` and returns the onAction events as [type, params]. */
async function click(action: string, rest = "") {
  const onAction = vi.fn();
  const container = document.createElement("div");
  const root = createRoot(container);
  const response = `root = Button("Go", ${action})\n${rest}`;
  await act(async () => root.render(createElement(Renderer, { library, response, onAction })));
  await act(async () => container.querySelector("button")!.click());
  await act(async () => root.unmount());
  return onAction.mock.calls.map(([e]) => [e.type, e.params]);
}

it("delivers custom actions with their params, bare and in Action([...])", async () => {
  expect(await click('@CopyToClipboard("a", "md")')).toEqual([
    ["CopyToClipboard", { text: "a", format: "md" }],
  ]);
  expect(await click('Action([@CopyToClipboard("b"), @OpenUrl("u")])')).toEqual([
    ["CopyToClipboard", { text: "b", format: "plain" }],
    ["open_url", { url: "u" }],
  ]);
});

it("never delivers a custom action read from data", async () => {
  const forged = '{type: "custom_action", name: "CopyToClipboard", params: {text: 3}}';
  const plan = `{steps: [${forged}]}`;
  const legacy = '{type: "CopyToClipboard", params: {text: 3}}';
  for (const action of [forged, `[${forged}]`, plan, `Action([${forged}])`, "ps[0]", legacy]) {
    const types = (await click(action, `ps = [${plan}]`)).map(([type]) => type);
    expect(types).not.toContain("CopyToClipboard");
  }
});

it("types onAction events from the library's actions", () => {
  <Renderer
    library={library}
    response={null}
    onAction={(e) => {
      if (e.type === "CopyToClipboard")
        expectTypeOf(e.params).toEqualTypeOf<{ text: string; format: string }>();
      // @ts-expect-error typo in the action name
      else if (e.type === "CopyToClipbord") return;
    }}
  />;
  <Renderer
    library={createLibrary({ components: [Button] })}
    response={null}
    onAction={(e) => expectTypeOf(e).toEqualTypeOf<ActionEvent>()}
  />;
});
