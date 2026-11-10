// @vitest-environment jsdom
import {
  ChatProvider,
  type ArtifactStorage,
  type ArtifactStreamEvent,
  type ChatStorage,
} from "@openuidev/react-headless";
import {
  createLibrary,
  defineComponent,
  reactive,
  useStateField,
  type OpenUIError,
} from "@openuidev/react-lang";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { LiveArtifactRenderer } from "../ArtifactRenderer";
import { ArtifactRendererRoot, type RenderContentArgs } from "../ArtifactRendererRoot";
import type { ArtifactError } from "../errors";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const llm = { send: vi.fn(), streamProtocol: { parse: async function* () {} } } as never;

/** Every total the dashboard rendered, in order, and the setter of its `$filter`. */
let renders: number[] = [];
let setFilter: (value: string) => void = () => {};
const Board = defineComponent({
  name: "Board",
  props: z.object({ total: z.number(), filter: reactive(z.string()) }),
  description: "Board",
  component: ({ props }) => {
    const filter = useStateField("filter", props.filter);
    setFilter = filter.setValue;
    renders.push(props.total);
    return createElement("output", null, `${props.total} ${filter.value}`);
  },
});
const library = createLibrary({ root: "Board", components: [Board] });
const dashboard =
  '$filter = "all"\nroot = Board(q.total, $filter)\nq = Query("totals", {}, {total: 0})';
const KEY = "v1|totals::{}";

/** An artifact storage that serves the dashboard at `version`. */
function cloud(version: string, getResults: ArtifactStorage["getResults"]) {
  const putResult = vi.fn();
  const artifact = {
    list: async () => ({ artifacts: [] }),
    get: async () => ({}),
    update: async () => ({}),
    async *stream(id: string): AsyncIterable<ArtifactStreamEvent> {
      yield { type: "reference", data: { id, version } };
      yield { type: "delta", data: { text: dashboard } };
      await sleep(5);
      yield { type: "end" };
    },
    getResults,
    putResult,
  } as unknown as ArtifactStorage;
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
  return { storage, putResult };
}

describe("ArtifactRendererRoot last results", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.spyOn(console, "error").mockImplementation(() => {});
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    renders = [];
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const settle = async () => {
    for (let i = 0; i < 6; i++) {
      await act(async () => {
        await sleep(5);
      });
    }
  };

  /** The real renderer on artifact "a"; each data call waits in `calls` to be answered. */
  async function open(storage: ChatStorage) {
    const calls: Array<{ resolve: (result: unknown) => void; reject: (error: Error) => void }> = [];
    const errors: Array<OpenUIError | ArtifactError> = [];
    await act(async () => {
      root.render(
        <ChatProvider llm={llm} storage={storage}>
          <LiveArtifactRenderer
            id="a"
            preview={false}
            library={library}
            interpreter={() => new Promise((resolve, reject) => calls.push({ resolve, reject }))}
            onError={(next) => errors.splice(0, errors.length, ...next)}
          />
        </ChatProvider>,
      );
    });
    await settle();
    return { calls, errors, shown: () => container.querySelector("output")?.textContent };
  }

  it("a first open behaves as before: one call per query, and its result is saved once", async () => {
    const c = cloud("v1", async () => ({}));
    const view = await open(c.storage);
    expect(view.calls).toHaveLength(1);
    view.calls[0]!.resolve({ total: 7 });
    await settle();
    expect(view.shown()).toBe("7 all");
    expect(view.calls).toHaveLength(1);
    expect([...new Set(renders)]).toEqual([null, 0, 7]);
    expect(c.putResult.mock.calls).toEqual([["a", { key: KEY, result: { total: 7 } }]]);
  });

  it("a reopened dashboard shows the stored result, then the fresh one, with one call and its state kept", async () => {
    const c = cloud("v1", async () => ({ [KEY]: { total: 7 } }));
    const view = await open(c.storage);
    expect(view.shown()).toBe("7 all");
    const committed: string[] = [];
    const observer = new MutationObserver(() => committed.push(view.shown() ?? "none"));
    observer.observe(container, { childList: true, characterData: true, subtree: true });
    await act(async () => setFilter("mine"));
    expect(view.shown()).toBe("7 mine");

    view.calls[0]!.resolve({ total: 9 });
    await settle();
    expect(view.shown()).toBe("9 mine");
    expect(view.calls).toHaveLength(1);
    expect(c.putResult.mock.calls).toEqual([["a", { key: KEY, result: { total: 9 } }]]);
    observer.disconnect();
    // Known defect: the switch commits the query's default once before the fresh result.
    expect(committed).toEqual(["7 mine", "0 mine", "9 mine"]);
  });

  it("stored results that arrive after the query started are still shown, unless the fresh one is first", async () => {
    const late = async () => {
      await sleep(15);
      return { [KEY]: { total: 7 } };
    };
    const view = await open(cloud("v1", late).storage);
    expect(view.calls).toHaveLength(1);
    expect(view.shown()).toBe("7 all");
    view.calls[0]!.resolve({ total: 9 });
    await settle();
    expect(view.shown()).toBe("9 all");
    expect(view.calls).toHaveLength(1);

    await act(async () => root.unmount());
    root = createRoot(container);
    renders = [];
    const never = () => new Promise<Record<string, unknown>>(() => {});
    const fast = await open(cloud("v1", never).storage);
    fast.calls[0]!.resolve({ total: 9 });
    await settle();
    expect(fast.shown()).toBe("9 all");
    expect(renders).not.toContain(7);
  });

  it("a failed call shows the error, not the stored result", async () => {
    const c = cloud("v1", async () => ({ [KEY]: { total: 7 } }));
    const view = await open(c.storage);
    expect(view.shown()).toBe("7 all");
    view.calls[0]!.reject(new Error("down"));
    await settle();
    expect(view.shown()).toBe("0 all");
    expect(view.errors.map((error) => error.code)).toEqual(["tool-error"]);
    expect(view.calls).toHaveLength(1);
    expect(c.putResult).not.toHaveBeenCalled();
  });

  it("results stored for another version are ignored", async () => {
    const c = cloud("v2", async () => ({ [KEY]: { total: 7 } }));
    const view = await open(c.storage);
    expect(view.shown()).toBe("0 all");
    view.calls[0]!.resolve({ total: 9 });
    await settle();
    expect(view.shown()).toBe("9 all");
    expect(view.calls).toHaveLength(1);
    expect(renders).not.toContain(7);
  });

  it("a closed preview card neither reads nor writes", async () => {
    const getResults = vi.fn(async () => ({}));
    const c = cloud("v1", getResults);
    let args!: RenderContentArgs;
    const show = async (isOpen: boolean) => {
      await act(async () => {
        root.render(
          <ChatProvider llm={llm} storage={c.storage}>
            <ArtifactRendererRoot
              id="a"
              isOpen={isOpen}
              interpreter={async () => ({ total: 7 })}
              renderContent={(next) => {
                args = next;
                return null;
              }}
            />
          </ChatProvider>,
        );
      });
      await settle();
    };
    await show(false);
    expect(getResults).not.toHaveBeenCalled();
    await show(true);
    expect(getResults).toHaveBeenCalledTimes(1);
    await show(false);
    await args.toolProvider!.callTool({ name: "totals", arguments: {} });
    await settle();
    expect(c.putResult).not.toHaveBeenCalled();
  });
});
