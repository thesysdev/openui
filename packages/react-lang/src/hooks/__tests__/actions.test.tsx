// @vitest-environment jsdom
import { tagSchemaId, type ActionEvent } from "@openuidev/lang-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { z } from "zod/v4";
import { useTriggerAction } from "../../context";
import { createLibrary, defineComponent } from "../../library";
import { Renderer } from "../../Renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Render `response`, click every `Btn` in order, and return the action events. */
async function clickAll(response: string): Promise<ActionEvent[]> {
  const clicks = new Map<string, () => void | Promise<void>>();
  const actionExpression = z.any();
  tagSchemaId(actionExpression, "ActionExpression");
  const Btn = defineComponent({
    name: "Btn",
    description: "",
    props: z.object({ label: z.string(), action: actionExpression.optional() }),
    component: ({ props }) => {
      const trigger = useTriggerAction();
      clicks.set(props.label, () => trigger(props.label, undefined, props.action as any));
      return null;
    },
  });
  const Stack = defineComponent({
    name: "Stack",
    description: "",
    props: z.object({ children: z.array(z.any()) }),
    component: ({ props, renderNode }) => <>{renderNode(props.children)}</>,
  });
  const library = createLibrary({ components: [Stack, Btn], root: "Stack" });
  const events: ActionEvent[] = [];
  const root = createRoot(document.createElement("div"));
  act(() => {
    root.render(
      <Renderer library={library} response={response} onAction={(e) => events.push(e)} />,
    );
  });
  for (const click of [...clicks.values()]) await act(click);
  act(() => root.unmount());
  return events;
}

it("delivers bare and Action([...]) steps, with the @ToAssistant context", async () => {
  const events = await clickAll(
    [
      `root = Stack([a, b, c, d])`,
      `a = Btn("a", @ToAssistant("A", { ticket: "T-42" }))`,
      `b = Btn("b", Action([@OpenUrl("https://x.test"), @ToAssistant("B", 0)]))`,
      `c = Btn("c", Action([@ToAssistant("C")]))`,
      `d = Btn("d", {type: "custom", params: {id: 1}})`,
    ].join("\n"),
  );
  expect(events.map((e) => [e.type, e.humanFriendlyMessage, e.params])).toEqual([
    ["continue_conversation", "A", { context: { ticket: "T-42" } }],
    ["open_url", "", { url: "https://x.test" }],
    ["continue_conversation", "B", { context: 0 }],
    ["continue_conversation", "C", {}],
    ["custom", "d", { id: 1 }],
  ]);
});
