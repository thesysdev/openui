// @vitest-environment jsdom
import type { ActionEvent } from "@openuidev/lang-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { useTriggerAction } from "../../context";
import { createLibrary, defineComponent } from "../../library";
import { Renderer } from "../../Renderer";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Renders `root = Stack([b])`, clicks the one `Btn`, and returns the action events. */
async function clickOnce(statements: string[]): Promise<ActionEvent[]> {
  let click: () => void | Promise<void> = () => {};
  const Btn = defineComponent({
    name: "Btn",
    description: "",
    props: z.object({ label: z.string(), action: z.any().optional() }),
    component: ({ props }) => {
      const trigger = useTriggerAction();
      click = () => trigger(props.label as string, undefined, props.action as never);
      return <button>{props.label as string}</button>;
    },
  });
  const Stack = defineComponent({
    name: "Stack",
    description: "",
    props: z.object({ children: z.array(z.any()) }),
    component: ({ props, renderNode }) => <div>{renderNode(props.children)}</div>,
  });
  const library = createLibrary({ components: [Stack, Btn], root: "Stack" });
  const events: ActionEvent[] = [];
  const root = createRoot(document.createElement("div"));
  const response = [`root = Stack([b])`, ...statements].join("\n");
  act(() => {
    root.render(
      <Renderer
        library={library}
        response={response}
        isStreaming={false}
        onAction={(e) => events.push(e)}
      />,
    );
  });
  await act(() => click());
  act(() => root.unmount());
  return events;
}

describe("form state is read when each step runs", () => {
  it("an earlier @Set in the same plan is visible in the event's form state", async () => {
    const events = await clickOnce([
      `$x = 1`,
      `b = Btn("go", Action([@Set($x, 2), @ToAssistant("m")]))`,
    ]);
    expect(events).toHaveLength(1);
    expect(events[0].formState).toMatchObject({ $x: 2 });
  });

  it("each event in a plan carries the state as of its own step", async () => {
    const events = await clickOnce([
      `$x = 1`,
      `b = Btn("go", Action([@ToAssistant("first"), @Set($x, 2), @ToAssistant("second")]))`,
    ]);
    expect(events.map((e) => (e.formState as Record<string, unknown>).$x)).toEqual([1, 2]);
  });
});
