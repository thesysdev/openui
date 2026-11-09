// @vitest-environment jsdom
import {
  ChatProvider,
  InterpreterError,
  type ArtifactStorage,
  type ArtifactStreamEvent,
  type ChatStorage,
  type InterpreterToolProvider,
} from "@openuidev/react-headless";
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArtifactRendererRoot } from "../ArtifactRendererRoot";
import { useArtifactRenderer } from "../contexts";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * OpenUI Cloud in miniature: each read streams the version `served()` gives,
 * and the interpreter refuses a call for any version but `latest`.
 */
function cloud(served: (read: number) => string, latest: () => string) {
  const reads: string[] = [];
  const calls: string[] = [];
  const artifact = {
    list: async () => ({ artifacts: [] }),
    get: async () => ({}),
    update: async () => ({}),
    async *stream(id: string): AsyncIterable<ArtifactStreamEvent> {
      const version = served(reads.length);
      reads.push(version);
      await new Promise((resolve) => setTimeout(resolve, 5)); // the network
      yield { type: "reference", data: { id, version } };
      yield { type: "delta", data: { text: `root = ${version}` } };
      yield { type: "end" };
    },
  } as unknown as ArtifactStorage;
  const interpreter = async (request: { version?: string }) => {
    calls.push(request.version ?? "");
    // The second renderer's answer lands while the first one's re-read runs.
    await new Promise((resolve) => setTimeout(resolve, 10 + 3 * (calls.length % 2 === 0 ? 1 : 0)));
    if (request.version !== latest()) {
      throw new InterpreterError(
        "The dashboard changed since it was shown.",
        "ARTIFACT_VERSION_MISMATCH",
      );
    }
    return { total: 1 };
  };
  return { artifact, interpreter, reads, calls };
}

const chatStorage = (artifact: ArtifactStorage): ChatStorage =>
  ({
    thread: {
      listThreads: async () => ({ threads: [] }),
      createThread: async () => ({ id: "t", title: "t", createdAt: "" }),
      getMessages: async () => [],
      updateThread: async (thread: unknown) => thread,
      deleteThread: async () => {},
    },
    artifact,
  }) as unknown as ChatStorage;

const llm = { send: vi.fn(), streamProtocol: { parse: async function* () {} } } as never;

const errors: Record<string, string | undefined> = {};
/**
 * Runs one data call once there's a program, like a Query: react-lang keeps a
 * Query's result while its line is unchanged, so a new program with the same
 * Query doesn't call again; only a remount (`rendererKey`) does.
 */
function Content({
  name,
  program,
  toolProvider,
}: {
  name: string;
  program: string | null;
  toolProvider?: InterpreterToolProvider;
}) {
  const { error } = useArtifactRenderer();
  errors[name] = error?.message;
  const hasProgram = !!program;
  useEffect(() => {
    if (hasProgram && toolProvider) {
      toolProvider.callTool({ name: "totals", arguments: {} }).catch(() => {});
    }
  }, [hasProgram, toolProvider]);
  return null;
}

describe("ArtifactRendererRoot version refusals", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    for (const key of Object.keys(errors)) delete errors[key];
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  async function renderTwo(artifact: ArtifactStorage, interpreter: never) {
    const renderer = (name: string) => (
      <ArtifactRendererRoot
        key={name}
        id="a1"
        preview={false}
        interpreter={interpreter}
        renderContent={({ program, toolProvider, rendererKey }) => (
          <Content key={rendererKey} name={name} program={program} toolProvider={toolProvider} />
        )}
      />
    );
    await act(async () => {
      root.render(
        <ChatProvider llm={llm} storage={chatStorage(artifact)}>
          {renderer("panel")}
          {renderer("card")}
        </ChatProvider>,
      );
    });
    for (let i = 0; i < 12; i++) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
      });
    }
  }

  it("two renderers on an old version: one re-read, both re-run on the new one, no error", async () => {
    // Edited elsewhere: the first read still serves v1, the store has v2.
    const c = cloud(
      (read) => (read === 0 ? "v1" : "v2"),
      () => "v2",
    );
    await renderTwo(c.artifact, c.interpreter as never);
    expect(c.reads).toEqual(["v1", "v2"]);
    expect(c.calls).toEqual(["v1", "v1", "v2", "v2"]);
    expect(errors).toEqual({ panel: undefined, card: undefined });
  });

  it("a real mismatch: one re-read, then both renderers show the refusal", async () => {
    const c = cloud(
      () => "v1",
      () => "v9",
    );
    await renderTwo(c.artifact, c.interpreter as never);
    expect(c.reads).toEqual(["v1", "v1"]);
    expect(c.calls).toEqual(["v1", "v1"]);
    expect(errors.panel).toBeDefined();
    expect(errors.card).toBeDefined();
  });

  it("a server whose version changes on every read: bounded reads and calls, then the error", async () => {
    let n = 0;
    const c = cloud(
      () => `v${++n}`,
      () => `v${n + 1}`,
    );
    await renderTwo(c.artifact, c.interpreter as never);
    expect(c.reads.length).toBeLessThanOrEqual(2);
    expect(c.calls.length).toBeLessThanOrEqual(4);
    expect(errors.panel).toBeDefined();
  });
});
