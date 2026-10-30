// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { z } from "zod/v4";
import type { OpenUIError } from "./index";
import { createLibrary, defineComponent, tagSchemaId, useTriggerAction } from "./index";
import { Renderer } from "./Renderer";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const actionExpression = z.any();
tagSchemaId(actionExpression, "ActionExpression");
const Button = defineComponent({
  name: "Button",
  props: z.object({ label: z.string(), action: actionExpression }),
  description: "Runs an action",
  component: ({ props }) => {
    const trigger = useTriggerAction();
    return createElement(
      "button",
      {
        onClick: () => trigger(props.label, undefined, props.action),
      },
      props.label,
    );
  },
});
const library = createLibrary({ root: "Button", components: [Button] });

it.each(["Query", "Mutation"])(
  "reports unknown functions in %s while preserving tool execution",
  async (kind) => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const save = vi.fn(async (_args: Record<string, unknown>) => ({ saved: true }));
    let errors: OpenUIError[] = [];
    const response = `root = Button("Run", @Run(job))\njob = ${kind}("save", {amount: @DoesNotExist(42)})`;
    const render = async (program: string, isStreaming = false) => {
      await act(async () =>
        root.render(
          createElement(Renderer, {
            library,
            response: program,
            isStreaming,
            toolProvider: { save },
            onError: (next) => {
              errors = next;
            },
            publishObservability: false,
          }),
        ),
      );
    };
    try {
      await render(response, true);
      expect(errors).toEqual([]);
      await render(response);
      expect(errors).toEqual([
        expect.objectContaining({
          code: "unknown-function",
          statementId: "job",
        }),
      ]);
      expect(errors[0]?.message).toContain("@DoesNotExist");
      expect(save).toHaveBeenCalledTimes(kind === "Query" ? 1 : 0);
      await act(async () => container.querySelector("button")!.click());
      expect(save).toHaveBeenLastCalledWith({ amount: null });
      expect(save).toHaveBeenCalledTimes(kind === "Query" ? 2 : 1);
      expect(errors).toHaveLength(1);
      await render(response.replace("@DoesNotExist(42)", "@Sum([40, 2])"));
      expect(errors).toEqual([]);
      await act(async () => container.querySelector("button")!.click());
      expect(save).toHaveBeenLastCalledWith({ amount: 42 });
    } finally {
      await act(async () => root.unmount());
    }
  },
);
