// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent } from "../../library";
import { Renderer } from "../../Renderer";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("truncated default with onStateUpdate fed back as initialState", () => {
  it("the full statement still replaces the truncated default", () => {
    const Text = defineComponent({
      name: "Text",
      description: "",
      props: z.object({ text: z.any() }),
      component: ({ props }) => <span>{String(props.text)}</span>,
    });
    const Stack = defineComponent({
      name: "Stack",
      description: "",
      props: z.object({ children: z.array(z.any()) }),
      component: ({ props, renderNode }) => <div>{renderNode(props.children)}</div>,
    });
    const library = createLibrary({ components: [Stack, Text], root: "Stack" });

    // The reference chat persists every onStateUpdate and passes it back as initialState.
    let persisted: Record<string, unknown> | undefined;
    const container = document.createElement("div");
    const root = createRoot(container);
    const render = (response: string) =>
      act(() => {
        root.render(
          <Renderer
            library={library}
            response={response}
            isStreaming={true}
            onStateUpdate={(s) => (persisted = s)}
            initialState={persisted}
          />,
        );
      });

    render(`root = Stack([Text($title)])\n`);
    render(`root = Stack([Text($title)])\n$title = "Quarterly rev`);
    render(`root = Stack([Text($title)])\n$title = "Quarterly rev`);
    render(`root = Stack([Text($title)])\n$title = "Quarterly revenue"\n`);
    expect(container.textContent).toBe("Quarterly revenue");
    act(() => root.unmount());
  });
});
