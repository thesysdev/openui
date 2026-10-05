import {
  createLibrary,
  defineComponent,
  FormNameContext,
  useIsStreaming,
  useStateField,
} from "@openuidev/react-lang";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { createA2UIClient } from "../client";
import { A2UIRenderer } from "../Renderer";
import type { RendererToAgentMessage } from "../types";

const TextContent = defineComponent({
  name: "TextContent",
  description: "Text",
  props: z.object({ text: z.string() }),
  component: ({ props, statementId }) => <span data-statement={statementId}>{props.text}</span>,
});

const Stack = defineComponent({
  name: "Stack",
  description: "Stack",
  props: z.object({ children: z.array(TextContent.ref) }),
  component: ({ props, renderNode }) => <div>{renderNode(props.children)}</div>,
});

const library = createLibrary({ components: [Stack, TextContent], root: "Stack" });

const Field = defineComponent({
  name: "Field",
  description: "Interactive test field",
  props: z.object({ name: z.string() }),
  component: ({ props }) => {
    const field = useStateField<string>(props.name);
    const isStreaming = useIsStreaming();
    return (
      <button
        data-streaming={String(isStreaming)}
        disabled={isStreaming}
        onClick={() => field.setValue("typed@x.com")}
      >
        {field.value ?? ""}
      </button>
    );
  },
});

const Form = defineComponent({
  name: "Form",
  description: "Test form",
  props: z.object({ name: z.string(), fields: z.array(Field.ref) }),
  component: ({ props, renderNode }) => (
    <FormNameContext.Provider value={props.name}>
      {renderNode(props.fields)}
    </FormNameContext.Provider>
  ),
});

const formLibrary = createLibrary({ components: [Form, Field], root: "Form" });

describe("A2UIRenderer", () => {
  it("renders the active A2UI surface through the OpenUI Lang React renderer", async () => {
    const client = createA2UIClient({
      schema: library.toJSONSchema(),
      rootName: library.root,
    });
    await client.process({
      version: "v1.0",
      createSurface: { surfaceId: "main", catalogId: "com.example:test" },
    });
    await client.process({
      version: "v1.0",
      updateComponents: {
        surfaceId: "main",
        components: ["root = Stack([greeting])", 'greeting = TextContent("Hello A2UI")'],
      },
    });

    const html = renderToStaticMarkup(
      <A2UIRenderer client={client} surfaceId="main" library={library} />,
    );
    expect(html).toContain("Hello A2UI");
    expect(html).toContain('data-statement="greeting"');
  });

  it("renders nothing after the surface is deleted", async () => {
    const client = createA2UIClient({ schema: library.toJSONSchema() });
    await client.process({
      version: "v1.0",
      createSurface: { surfaceId: "main", catalogId: "com.example:test" },
    });
    await client.process({
      version: "v1.0",
      deleteSurface: { surfaceId: "main" },
    });

    expect(
      renderToStaticMarkup(<A2UIRenderer client={client} surfaceId="main" library={library} />),
    ).toBe("");
  });

  it("keeps live form input and the A2UI data model converged", async () => {
    const client = createA2UIClient({
      schema: formLibrary.toJSONSchema(),
      rootName: formLibrary.root,
    });
    await client.process({
      version: "v1.0",
      createSurface: {
        surfaceId: "main",
        dataModel: { contact: { email: "seed@x.com" } },
        components: ['root = Form("contact", [email])', 'email = Field("email")'],
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const onStateUpdate = vi.fn();
    const revisionBeforeInput = client.getSurface("main")!.revision;

    await act(async () => {
      root.render(
        <A2UIRenderer
          client={client}
          surfaceId="main"
          library={formLibrary}
          onStateUpdate={onStateUpdate}
        />,
      );
    });
    const button = container.querySelector("button")!;
    expect(button.textContent).toBe("seed@x.com");

    await act(async () => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(button.textContent).toBe("typed@x.com");
    expect(client.getSurface("main")?.dataModel).toEqual({
      contact: { email: "typed@x.com" },
    });
    expect(client.getSurface("main")?.revision).toBe(revisionBeforeInput + 1);
    expect(onStateUpdate).toHaveBeenCalledTimes(1);

    await act(async () => {
      await Promise.resolve();
    });
    expect(client.getSurface("main")?.dataModel).toEqual({
      contact: { email: "typed@x.com" },
    });

    await act(async () => {
      await client.process({
        version: "v1.0",
        updateDataModel: {
          surfaceId: "main",
          path: "/contact/email",
          value: "agent@x.com",
        },
      });
    });
    expect(button.textContent).toBe("agent@x.com");
    expect(client.getSurface("main")?.dataModel).toEqual({
      contact: { email: "agent@x.com" },
    });

    await act(async () => root.unmount());
    container.remove();
  });

  it("forwards the A2UI transport streaming state", async () => {
    const client = createA2UIClient({
      schema: formLibrary.toJSONSchema(),
      rootName: formLibrary.root,
    });
    await client.process({
      version: "v1.0",
      createSurface: {
        surfaceId: "main",
        components: ['root = Form("contact", [email])', 'email = Field("email")'],
      },
    });
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <A2UIRenderer client={client} surfaceId="main" library={formLibrary} isStreaming />,
      );
    });
    expect(container.querySelector("button")?.disabled).toBe(true);
    expect(container.querySelector("button")?.dataset.streaming).toBe("true");

    await act(async () => root.unmount());
  });

  it("routes OpenUI Query calls through A2UI callAgentFunction by default", async () => {
    const messages: RendererToAgentMessage[] = [];
    const client = createA2UIClient({
      schema: library.toJSONSchema(),
      rootName: library.root,
      createId: () => "query-call-1",
      onMessage: (message) => messages.push(message),
    });
    await client.process({
      version: "v1.0",
      createSurface: {
        surfaceId: "main",
        components: [
          'data = Query("lookup", {id: 42}, {text: "Loading"})',
          "root = Stack([greeting])",
          "greeting = TextContent(data.text)",
        ],
      },
    });
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<A2UIRenderer client={client} surfaceId="main" library={library} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(messages.at(-1)).toEqual({
      version: "v1.0",
      callAgentFunction: {
        surfaceId: "main",
        functionCallId: "query-call-1",
        callFunction: { call: "lookup", args: { id: 42 } },
      },
    });

    await act(async () => {
      await client.process({
        version: "v1.0",
        agentFunctionResponse: {
          functionCallId: "query-call-1",
          value: { text: "Loaded from agent" },
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.textContent).toContain("Loaded from agent");

    await act(async () => root.unmount());
  });
});
