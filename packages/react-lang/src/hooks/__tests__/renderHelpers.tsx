import type { ActionEvent } from "@openuidev/lang-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod/v4";
import { useSetFieldValue, useTriggerAction } from "../../context";
import { createLibrary, defineComponent } from "../../library";
import { Renderer } from "../../Renderer";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type TriggerAction = ReturnType<typeof useTriggerAction>;
type SetFieldValue = ReturnType<typeof useSetFieldValue>;

/**
 * Mount `response` with a one-component library. `Btn(label, action)` exposes
 * its evaluated action; `click(i)` triggers the i-th button the way a library
 * button would (`triggerAction(label, formName, action)`).
 */
export function mountProgram(response: string) {
  const buttons: { label: string; action: unknown }[] = [];
  let trigger: TriggerAction | undefined;
  let setField: SetFieldValue | undefined;

  const Btn = defineComponent({
    name: "Btn",
    description: "",
    props: z.object({ label: z.string(), action: z.any().optional() }),
    component: ({ props }) => {
      trigger = useTriggerAction();
      setField = useSetFieldValue();
      buttons.push({ label: props.label as string, action: props.action });
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
  const container = document.createElement("div");
  const root = createRoot(container);
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

  /** Latest evaluated action for the button with this label. */
  const actionOf = (label: string) => [...buttons].reverse().find((b) => b.label === label)?.action;

  return {
    events,
    actionOf,
    setField: (...args: Parameters<SetFieldValue>) => act(() => setField!(...args)),
    click: async (label: string, formName?: string) => {
      await act(async () => {
        await trigger!(label, formName, actionOf(label) as Parameters<TriggerAction>[2]);
      });
    },
    unmount: () => act(() => root.unmount()),
  };
}
