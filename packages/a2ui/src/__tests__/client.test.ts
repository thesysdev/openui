import type { LibraryJSONSchema } from "@openuidev/lang-core";
import { describe, expect, it, vi } from "vitest";
import { A2UIFunctionError, createA2UIClient } from "../client";
import {
  applyDataModelUpdate,
  dataModelToOpenUIState,
  mergeOpenUIStateIntoDataModel,
} from "../json-pointer";
import type { RendererToAgentMessage } from "../types";

const schema: LibraryJSONSchema = {
  $defs: {
    Stack: {
      properties: { children: {} },
      required: ["children"],
    },
    TextContent: {
      properties: { text: {}, variant: {} },
      required: ["text"],
    },
  },
};

function createSurface(client: ReturnType<typeof createA2UIClient>) {
  return client.process({
    version: "v1.0",
    createSurface: {
      surfaceId: "main",
      catalogId: "com.example:openui",
      dataModel: { user: { name: "Alice" } },
    },
  });
}

describe("A2UIClient", () => {
  it("runs the A2UI surface lifecycle with incremental OpenUI Lang updates", async () => {
    const client = createA2UIClient({ schema });

    expect((await createSurface(client)).ok).toBe(true);
    expect(
      (
        await client.process({
          version: "v1.0",
          updateComponents: {
            surfaceId: "main",
            components: ["root = Stack([title])", 'title = TextContent("Hello")'],
          },
        })
      ).ok,
    ).toBe(true);

    let surface = client.getSurface("main");
    expect(surface?.parseResult?.root?.typeName).toBe("Stack");
    expect(surface?.parseResult?.root?.props.children).toEqual([
      expect.objectContaining({
        typeName: "TextContent",
        statementId: "title",
        props: { text: "Hello", variant: undefined },
      }),
    ]);

    await client.process({
      version: "v1.0",
      updateComponents: {
        surfaceId: "main",
        components: ['title = TextContent("Updated")'],
      },
    });
    expect(client.getSurface("main")?.source).toContain('title = TextContent("Updated")');
    expect(client.getSurface("main")?.source).not.toContain('TextContent("Hello")');

    await client.process({
      version: "v1.0",
      updateDataModel: { surfaceId: "main", path: "/user/name", value: "Bob" },
    });
    surface = client.getSurface("main");
    expect(surface?.dataModel).toEqual({ user: { name: "Bob" } });

    expect(
      (
        await client.process({
          version: "v1.0",
          deleteSurface: { surfaceId: "main" },
        })
      ).ok,
    ).toBe(true);
    expect(client.getSurface("main")).toBeUndefined();
  });

  it("supports single-message creation with Lang components and no catalogId", async () => {
    const client = createA2UIClient({ schema });
    const result = await client.process({
      version: "v1.0",
      createSurface: {
        surfaceId: "main",
        components: ["root = Stack([title])", 'title = TextContent("Created inline")'],
      },
    });

    expect(result.ok).toBe(true);
    expect(client.getSurface("main")?.catalogId).toBeUndefined();
    expect(client.getSurface("main")?.parseResult?.root?.props.children).toEqual([
      expect.objectContaining({ props: { text: "Created inline", variant: undefined } }),
    ]);
  });

  it("preserves components that are referenced by a later incremental update", async () => {
    const client = createA2UIClient({ schema });
    await createSurface(client);
    await client.process({
      version: "v1.0",
      updateComponents: {
        surfaceId: "main",
        components: ["root = Stack([a])", 'a = TextContent("A")'],
      },
    });
    await client.process({
      version: "v1.0",
      updateComponents: { surfaceId: "main", components: ['b = TextContent("B")'] },
    });
    const result = await client.process({
      version: "v1.0",
      updateComponents: { surfaceId: "main", components: ["root = Stack([a, b])"] },
    });

    expect(result.ok).toBe(true);
    expect(client.getSurface("main")?.source).toContain('b = TextContent("B")');
    expect(client.getSurface("main")?.parseResult?.root?.props.children).toEqual([
      expect.objectContaining({ statementId: "a" }),
      expect.objectContaining({ statementId: "b" }),
    ]);
  });

  it("merges multiline blocks and deletes statements by ID", async () => {
    const client = createA2UIClient({ schema });
    await createSurface(client);

    await client.process({
      version: "v1.0",
      updateComponents: {
        surfaceId: "main",
        components: [
          `root = Stack([
            title
          ])
          title = TextContent("Before")`,
        ],
      },
    });
    const result = await client.process({
      version: "v1.0",
      updateComponents: {
        surfaceId: "main",
        components: ["title = null", "root = Stack([])"],
      },
    });

    expect(result.ok).toBe(true);
    expect(client.getSurface("main")?.source).toBe("root = Stack([])");
  });

  it("validates malformed transport input without throwing or corrupting state", async () => {
    const client = createA2UIClient({ schema });
    await createSurface(client);

    const missingComponents = await client.process({
      version: "v1.0",
      updateComponents: { surfaceId: "main" },
    });
    expect(missingComponents.ok).toBe(false);
    expect(missingComponents.issues?.[0]?.path).toBe("/updateComponents/components");
    expect(missingComponents.outbound[0]).toMatchObject({
      error: {
        code: "VALIDATION_FAILED",
        surfaceId: "main",
        path: "/updateComponents/components",
      },
    });

    const missingSurfaceId = await client.process({
      version: "v1.0",
      createSurface: { catalogId: "com.example:openui" },
    });
    expect(missingSurfaceId.ok).toBe(false);
    expect(missingSurfaceId.issues?.length).toBeGreaterThan(0);
    expect(client.getSurfaces()).toHaveLength(1);

    const wrongVersion = await client.process({ version: "v0.9", unknown: {} });
    expect(wrongVersion).toMatchObject({ ok: false, outbound: [], issues: expect.any(Array) });
  });

  it("emits the current A2UI action shape", async () => {
    const messages: RendererToAgentMessage[] = [];
    const client = createA2UIClient({
      schema,
      onMessage: (message) => messages.push(message),
      now: () => new Date("2026-07-24T10:00:00.000Z"),
    });
    await createSurface(client);

    client.dispatchAction({
      surfaceId: "main",
      sourceComponentId: "submitButton",
      name: "submit",
      userMessage: "Save profile",
      context: { intent: "save" },
      metadata: { extensions: { trace_id: "trace-1" } },
    });

    expect(messages.at(-1)).toEqual({
      version: "v1.0",
      action: {
        name: "submit",
        userMessage: "Save profile",
        surfaceId: "main",
        sourceComponentId: "submitButton",
        timestamp: "2026-07-24T10:00:00.000Z",
        context: { intent: "save" },
        metadata: { extensions: { trace_id: "trace-1" } },
      },
    });
  });

  it("calls agent functions and resolves agentFunctionResponse", async () => {
    const messages: RendererToAgentMessage[] = [];
    const client = createA2UIClient({
      schema,
      createId: () => "agent-call-1",
      onMessage: (message) => messages.push(message),
    });
    await createSurface(client);
    const response = client.callAgentFunction({
      surfaceId: "main",
      call: "lookup",
      args: { id: 42 },
    });

    expect(messages.at(-1)).toEqual({
      version: "v1.0",
      callAgentFunction: {
        surfaceId: "main",
        functionCallId: "agent-call-1",
        callFunction: { call: "lookup", args: { id: 42 } },
      },
    });

    await client.process({
      version: "v1.0",
      agentFunctionResponse: {
        functionCallId: "agent-call-1",
        value: { found: true },
      },
    });

    await expect(response).resolves.toEqual({ found: true });
  });

  it("rejects agent function errors", async () => {
    const client = createA2UIClient({ schema, createId: () => "agent-call-2" });
    await createSurface(client);
    const response = client.callAgentFunction({ surfaceId: "main", call: "save" });

    await client.process({
      version: "v1.0",
      agentFunctionResponse: {
        functionCallId: "agent-call-2",
        error: { code: "REJECTED", message: "Nope" },
      },
    });

    await expect(response).rejects.toEqual(
      expect.objectContaining<A2UIFunctionError>({ code: "REJECTED", message: "Nope" }),
    );
  });

  it("executes callRendererFunction and returns rendererFunctionResponse", async () => {
    const lookup = vi.fn(async ({ id }: { id?: unknown }) => ({ id: String(id), found: true }));
    const client = createA2UIClient({
      schema,
      functions: {
        lookup: {
          catalogId: "com.example:functions",
          allowedCallers: "agentOnly",
          handler: lookup as never,
        },
      },
    });

    const result = await client.process({
      version: "v1.0",
      callRendererFunction: {
        functionCallId: "function-1",
        callFunction: {
          call: "lookup",
          catalogId: "com.example:functions",
          args: { id: 42 },
        },
      },
    });

    expect(lookup).toHaveBeenCalledWith({ id: 42 });
    expect(result).toEqual({
      ok: true,
      outbound: [
        {
          version: "v1.0",
          rendererFunctionResponse: {
            functionCallId: "function-1",
            value: { id: "42", found: true },
          },
        },
      ],
    });
  });

  it("enforces allowedCallers and catalog identity for agent-initiated function calls", async () => {
    const client = createA2UIClient({
      schema,
      functions: {
        localOnly: {
          catalogId: "com.example:functions",
          allowedCallers: "rendererOnly",
          handler: () => ({ ok: true }),
        },
      },
    });

    const result = await client.process({
      version: "v1.0",
      callRendererFunction: {
        functionCallId: "function-local",
        callFunction: { call: "localOnly", catalogId: "com.example:functions" },
      },
    });

    expect(result.ok).toBe(false);
    expect(result.outbound[0]).toMatchObject({
      error: {
        code: "INVALID_FUNCTION_CALL",
        functionCallId: "function-local",
      },
    });
  });

  it("maps OpenUI action context, form state, and source statement to A2UI", async () => {
    const messages: RendererToAgentMessage[] = [];
    const client = createA2UIClient({ schema, onMessage: (message) => messages.push(message) });
    await createSurface(client);

    client.dispatchOpenUIAction(
      "main",
      {
        type: "submit",
        params: { mode: "fast" },
        humanFriendlyMessage: "Submit",
        formState: { contact: { email: { value: "a@example.com", componentType: "Input" } } },
        formName: "contact",
      },
      { sourceComponentId: "submitButton" },
    );

    expect(messages.at(-1)).toMatchObject({
      action: {
        name: "submit",
        sourceComponentId: "submitButton",
        context: {
          mode: "fast",
          formState: { contact: { email: "a@example.com" } },
        },
      },
    });
  });

  it("keeps renderer data-model metadata in sync with local OpenUI state", async () => {
    const client = createA2UIClient({ schema });
    await client.process({
      version: "v1.0",
      createSurface: {
        surfaceId: "main",
        catalogId: "com.example:openui",
        sendDataModel: true,
        dataModel: { user: { name: "Alice" } },
      },
    });

    expect(
      client.updateSurfaceFromOpenUIState("main", {
        $user: { name: "Carol" },
        contact: { email: { value: "c@example.com", componentType: "Input" } },
      }),
    ).toBe(true);
    expect(client.getRendererDataModel()).toEqual({
      version: "v1.0",
      surfaces: {
        main: {
          user: { name: "Carol" },
          contact: { email: "c@example.com" },
        },
      },
    });
  });

  it("filters renderer metadata to opted-in surfaces and includes capabilities", async () => {
    const metadata: unknown[] = [];
    const client = createA2UIClient({
      schema,
      rendererCapabilities: {
        "v1.0": { supportedCatalogIds: ["com.example:openui"] },
      },
      onMessage: (_message, nextMetadata) => metadata.push(nextMetadata),
    });
    await client.process({
      version: "v1.0",
      createSurface: {
        surfaceId: "shared",
        catalogId: "com.example:openui",
        sendDataModel: true,
        dataModel: { shared: true },
      },
    });
    await client.process({
      version: "v1.0",
      createSurface: {
        surfaceId: "private",
        catalogId: "com.example:openui",
        dataModel: { private: true },
      },
    });

    client.dispatchAction({
      surfaceId: "shared",
      sourceComponentId: "button",
      name: "submit",
    });

    expect(metadata.at(-1)).toEqual({
      a2uiRendererCapabilities: {
        "v1.0": { supportedCatalogIds: ["com.example:openui"] },
      },
      a2uiRendererDataModel: {
        version: "v1.0",
        surfaces: { shared: { shared: true } },
      },
    });
  });

  it("rejects a catalog outside configured renderer capabilities", async () => {
    const client = createA2UIClient({
      schema,
      rendererCapabilities: {
        "v1.0": { supportedCatalogIds: ["com.example:supported"] },
      },
    });

    const result = await client.process({
      version: "v1.0",
      createSurface: { surfaceId: "main", catalogId: "com.example:unsupported" },
    });

    expect(result.ok).toBe(false);
    expect(result.outbound[0]).toMatchObject({
      error: { code: "UNSUPPORTED_CATALOG", surfaceId: "main" },
    });
  });
});

describe("A2UI data model bridge", () => {
  it("supports RFC 6901 escaping, arrays, deletion, and root replacement", () => {
    let model = applyDataModelUpdate({}, "/a~1b/~0key", ["first", "second"]);
    expect(model).toEqual({ "a/b": { "~key": ["first", "second"] } });

    model = applyDataModelUpdate(model, "/a~1b/~0key/0", null);
    expect(model).toEqual({ "a/b": { "~key": ["second"] } });

    model = applyDataModelUpdate(model, "/", { replaced: true });
    expect(model).toEqual({ replaced: true });
  });

  it("converts A2UI data-model keys to Lang bindings and unwraps form state", () => {
    expect(dataModelToOpenUIState({ user: { name: "Alice" } })).toEqual({
      $user: { name: "Alice" },
    });
    expect(dataModelToOpenUIState({ user: { name: "Alice" } }, ["user"])).toEqual({
      $user: { name: "Alice" },
      user: { name: "Alice" },
    });
    expect(
      mergeOpenUIStateIntoDataModel(
        { untouched: true },
        { form: { field: { value: "hello", componentType: "Input" } } },
      ),
    ).toEqual({ untouched: true, form: { field: "hello" } });
  });

  it("selects whichever binding or form copy changed from the current model", () => {
    expect(
      mergeOpenUIStateIntoDataModel(
        { contact: { email: "old@example.com" } },
        {
          $contact: { email: "old@example.com" },
          contact: { email: { value: "form@example.com", componentType: "Input" } },
        },
      ),
    ).toEqual({ contact: { email: "form@example.com" } });

    expect(
      mergeOpenUIStateIntoDataModel({ filter: "all" }, { $filter: "active", filter: "all" }),
    ).toEqual({ filter: "all" });

    expect(mergeOpenUIStateIntoDataModel({ filter: "all" }, { $filter: "active" })).toEqual({
      filter: "active",
    });
  });

  it("does not let a stale binding mirror revert a user-edited form", async () => {
    const client = createA2UIClient({ schema });
    await client.process({
      version: "v1.0",
      createSurface: {
        surfaceId: "main",
        dataModel: { contact: { email: "seed@x.com" } },
      },
    });
    const state = {
      $contact: { email: "seed@x.com" },
      contact: {
        email: { value: "typed@x.com", componentType: "Input" },
      },
    };

    expect(client.updateSurfaceFromOpenUIState("main", state)).toBe(true);
    const revision = client.getSurface("main")?.revision;
    expect(client.getSurface("main")?.dataModel).toEqual({
      contact: { email: "typed@x.com" },
    });

    expect(client.updateSurfaceFromOpenUIState("main", state)).toBe(false);
    expect(client.getSurface("main")?.revision).toBe(revision);
    expect(client.getSurface("main")?.dataModel).toEqual({
      contact: { email: "typed@x.com" },
    });
  });
});
