// @vitest-environment jsdom
import {
  ChatProvider,
  type ArtifactStorage,
  type ArtifactStreamEvent,
  type ChatStorage,
  type InterpreterToolProvider,
} from "@openuidev/react-headless";
import { act, useEffect, useRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArtifactRendererRoot } from "../ArtifactRendererRoot";
import { useArtifactRenderer } from "../contexts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * OpenUI Cloud in miniature: a read of `id` streams `served(id)`, and a call is
 * refused unless its version is `latest(id)`. Calls answer after `delay` ms.
 */
function cloud(
  served: (id: string, read: number) => string,
  latest: (id: string) => string,
  delay: (id: string, call: number) => number = (_id, call) => (call % 2 ? 10 : 13),
) {
  const reads: string[] = [];
  const calls: string[] = [];
  const artifact = {
    list: async () => ({ artifacts: [] }),
    get: async () => ({}),
    update: async () => ({}),
    async *stream(id: string): AsyncIterable<ArtifactStreamEvent> {
      const version = served(id, reads.filter((r) => r.startsWith(`${id}@`)).length);
      reads.push(`${id}@${version}`);
      await sleep(5); // the network
      yield { type: "reference", data: { id, version } };
      yield { type: "delta", data: { text: `root = ${id}@${version}` } };
      yield { type: "end" };
    },
  } as unknown as ArtifactStorage;
  const interpreter = async (request: { id: string; version?: string }) => {
    calls.push(`${request.id}@${request.version}`);
    await sleep(delay(request.id, calls.length));
    if (request.version !== latest(request.id)) {
      const error = new Error("The dashboard changed since it was shown.");
      throw Object.assign(error, { code: "ARTIFACT_VERSION_MISMATCH" });
    }
    return { total: 1 };
  };
  const storage = {
    thread: {
      listThreads: async () => ({ threads: [] }),
      createThread: async () => ({ id: "t", title: "t", createdAt: "" }),
      getMessages: async () => [],
      updateThread: async (thread: unknown) => thread,
      deleteThread: async () => {},
    },
    artifact,
  } as unknown as ChatStorage;
  return { storage, interpreter, reads, calls };
}

const llm = { send: vi.fn(), streamProtocol: { parse: async function* () {} } } as never;
const errors: Record<string, string | undefined> = {};
const callsBy: Record<string, string[]> = {};

/**
 * One Query, as react-lang runs it: not while streaming, again when its program
 * changes, and a failed one only again on a remount (`rendererKey`).
 */
function Content({
  name,
  program,
  isStreaming,
  toolProvider,
}: {
  name: string;
  program: string | null;
  isStreaming: boolean;
  toolProvider?: InterpreterToolProvider;
}) {
  const { error } = useArtifactRenderer();
  errors[name] = error?.message;
  const ranFor = useRef<string | null>(null);
  const ready = program !== null && !isStreaming ? program.replace(/@.*/, "") : null;
  useEffect(() => {
    if (!ready || !toolProvider || ranFor.current === ready) return;
    ranFor.current = ready;
    (callsBy[name] ??= []).push(ready);
    toolProvider.callTool({ name: "totals", arguments: {} }).catch(() => {});
  }, [ready, toolProvider]);
  return null;
}

const renderer = (name: string, id: string, interpreter: unknown) => (
  <ArtifactRendererRoot
    key={name}
    id={id}
    preview={false}
    interpreter={interpreter as never}
    renderContent={({ program, isStreaming, toolProvider, rendererKey }) => (
      <Content
        key={rendererKey}
        name={name}
        program={program}
        isStreaming={isStreaming}
        toolProvider={toolProvider}
      />
    )}
  />
);

describe("ArtifactRendererRoot version refusals", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    for (const key of Object.keys(errors)) delete errors[key];
    for (const key of Object.keys(callsBy)) delete callsBy[key];
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function show(storage: ChatStorage, children: ReactNode, ms = 80) {
    await act(async () => {
      root.render(
        <ChatProvider llm={llm} storage={storage}>
          {children}
        </ChatProvider>,
      );
    });
    for (let i = 0; i < ms / 5; i++) {
      await act(async () => {
        await sleep(5);
      });
    }
  }

  it("two renderers on an old version: one re-read, both re-run on the new one, no error", async () => {
    const c = cloud(
      (_id, read) => (read === 0 ? "v1" : "v2"),
      () => "v2",
    );
    await show(c.storage, [
      renderer("panel", "a", c.interpreter),
      renderer("card", "a", c.interpreter),
    ]);
    expect(c.reads).toEqual(["a@v1", "a@v2"]);
    expect(c.calls).toEqual(["a@v1", "a@v1", "a@v2", "a@v2"]);
    expect(errors).toEqual({ panel: undefined, card: undefined });
  });

  it("a real mismatch: one re-read, then both renderers show the refusal", async () => {
    const c = cloud(
      () => "v1",
      () => "v9",
    );
    await show(c.storage, [
      renderer("panel", "a", c.interpreter),
      renderer("card", "a", c.interpreter),
    ]);
    expect(c.reads).toEqual(["a@v1", "a@v1"]);
    expect(c.calls).toEqual(["a@v1", "a@v1"]);
    expect(errors.panel).toBeDefined();
    expect(errors.card).toBeDefined();
  });

  it("a server whose version changes on every read: one re-read, then the error", async () => {
    let n = 0;
    const c = cloud(
      () => `v${++n}`,
      () => `v${n + 1}`,
    );
    await show(c.storage, [
      renderer("panel", "a", c.interpreter),
      renderer("card", "a", c.interpreter),
    ]);
    expect(c.reads).toEqual(["a@v1", "a@v2"]);
    expect(c.calls).toEqual(["a@v1", "a@v1", "a@v2", "a@v2"]);
    expect(errors.panel).toBeDefined();
  });

  it("reopened after a real mismatch and an edit elsewhere, the panel recovers", async () => {
    let now = 1_000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    let latest = "v9";
    const c = cloud(
      (_id, read) => (read < 2 ? "v1" : "v2"),
      () => latest,
    );
    await show(c.storage, renderer("panel", "a", c.interpreter));
    expect(errors.panel).toBeDefined();
    await show(c.storage, null);
    now += 60_000;
    latest = "v2";
    await show(c.storage, renderer("panel", "a", c.interpreter), 120);
    expect(errors.panel).toBeUndefined();
    expect(c.calls.at(-1)).toBe("a@v2");
  });

  it("a late refusal for the artifact a renderer switched away from re-runs nothing else", async () => {
    const c = cloud(
      () => "v1",
      (id) => (id === "a" ? "v2" : "v1"),
      (id) => (id === "a" ? 60 : 10),
    );
    await show(
      c.storage,
      [renderer("panel", "a", c.interpreter), renderer("card", "b", c.interpreter)],
      20,
    );
    await show(
      c.storage,
      [renderer("panel", "b", c.interpreter), renderer("card", "b", c.interpreter)],
      120,
    );
    expect(c.calls).toContain("a@v1");
    expect(callsBy.card).toEqual(["root = b"]);
    expect(c.reads).toEqual(["a@v1", "b@v1"]);
  });

  it("switching a renderer to another artifact runs that artifact's query once", async () => {
    const c = cloud(
      () => "v1",
      () => "v1",
    );
    await show(
      c.storage,
      [renderer("panel", "a", c.interpreter), renderer("card", "b", c.interpreter)],
      40,
    );
    await show(
      c.storage,
      [renderer("panel", "b", c.interpreter), renderer("card", "b", c.interpreter)],
      40,
    );
    expect(callsBy.panel).toEqual(["root = a", "root = b"]);
  });
});
