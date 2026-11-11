// @vitest-environment jsdom
import {
  ChatProvider,
  type ArtifactStorage,
  type ArtifactStreamEvent,
  type ChatStorage,
} from "@openuidev/react-headless";
import { createLibrary, defineComponent, reactive, useStateField } from "@openuidev/react-lang";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { LiveArtifactRenderer } from "../ArtifactRenderer";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const llm = { send: vi.fn(), streamProtocol: { parse: async function* () {} } } as never;

let setFilter: (value: string) => void = () => {};
const Board = defineComponent({
  name: "Board",
  props: z.object({ total: z.number(), filter: reactive(z.string()) }),
  description: "Board",
  component: ({ props }) => {
    const filter = useStateField("filter", props.filter);
    setFilter = filter.setValue;
    return createElement("output", null, `${props.total} ${filter.value}`);
  },
});
const library = createLibrary({ root: "Board", components: [Board] });
/** One query that reads `$filter`. */
const PROGRAM =
  '$filter = "all"\nroot = Board(q.total, $filter)\nq = Query("totals", {filter: $filter}, {total: 0})';
const ALL = 'totals::{"filter":"all"}';
const MINE = 'totals::{"filter":"mine"}';
type Entries = Record<string, unknown>;
/** The saved entry of a state, and of a result, for a version. */
const state = (filter: string, version = "v1") => ({ version, state: { $filter: filter } });
const result = (total: number) => ({ version: "v1", result: { total } });

/** An artifact storage that serves `PROGRAM` at v1; `read` gives its saved entries, if it keeps any. */
function cloud(read?: () => Promise<Entries>) {
  const saved = vi.fn();
  const artifact = {
    list: async () => ({ artifacts: [] }),
    get: async () => ({}),
    update: async () => ({}),
    async *stream(id: string): AsyncIterable<ArtifactStreamEvent> {
      yield { type: "reference", data: { id, version: "v1" } };
      yield { type: "delta", data: { text: PROGRAM } };
      await sleep(5);
      yield { type: "end" };
    },
    ...(read && { getQueryResults: vi.fn(read), putQueryResult: saved }),
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
  return { storage, saved, read: artifact.getQueryResults };
}

describe("ArtifactRendererRoot saved state", () => {
  let root: Root;
  let container: HTMLDivElement;
  /** The interpreter's calls, each waiting to be answered. */
  let calls: Array<{ filter: unknown; resolve: (r: unknown) => void }>;
  const shown = () => container.querySelector("output")?.textContent;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.spyOn(console, "error").mockImplementation(() => {});
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    calls = [];
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const settle = async (ms = 60) => {
    for (let i = 0; i < ms / 5; i++) {
      await act(async () => {
        await sleep(5);
      });
    }
  };

  /** Shows the dashboard and waits 60 ms, less than the wait for the saved entries. */
  async function show(storage: ChatStorage, props: Record<string, unknown> = {}) {
    await act(async () => {
      root.render(
        <ChatProvider llm={llm} storage={storage}>
          <LiveArtifactRenderer
            id="a"
            preview={false}
            library={library}
            interpreter={(request) =>
              new Promise((resolve) => calls.push({ filter: request.arguments.filter, resolve }))
            }
            {...props}
          />
        </ChatProvider>,
      );
    });
    await settle();
  }

  it("a changed filter is saved once, shortly after; a reopened dashboard starts on it with one call and its saved result", async () => {
    const first = cloud(async () => ({}));
    const onStateUpdate = vi.fn();
    await show(first.storage, { onStateUpdate });
    calls[0]!.resolve({ total: 9 });
    await settle();
    expect(first.saved.mock.calls).toEqual([["a", { key: ALL, value: result(9) }]]);

    await act(async () => setFilter("team"));
    await act(async () => setFilter("mine"));
    await settle();
    // Not yet: one save, shortly after the last change.
    expect(first.saved).toHaveBeenCalledTimes(1);
    await settle(600);
    expect(first.saved.mock.calls.slice(1)).toEqual([
      ["a", { key: "$state", value: state("mine") }],
    ]);
    expect(onStateUpdate).toHaveBeenLastCalledWith({ $filter: "mine" });

    await act(async () => root.unmount());
    root = createRoot(container);
    calls = [];
    const second = cloud(async () => ({ $state: state("mine"), [MINE]: result(8) }));
    await show(second.storage);
    expect(shown()).toBe("8 mine");
    expect(calls.map((call) => call.filter)).toEqual(["mine"]);
    calls[0]!.resolve({ total: 10 });
    await settle();
    expect(shown()).toBe("10 mine");
    expect(calls).toHaveLength(1);
    expect(second.read).toHaveBeenCalledTimes(1);
    // Restoring is not a change: only the fresh result is saved.
    expect(second.saved.mock.calls).toEqual([["a", { key: MINE, value: result(10) }]]);
  });

  it("the result fetched for a changed filter is saved too, so the reopened dashboard shows it at once", async () => {
    const first = cloud(async () => ({ [MINE]: result(8) }));
    await show(first.storage);
    calls[0]!.resolve({ total: 9 });
    await settle();

    await act(async () => setFilter("mine"));
    await settle();
    // A real call, not answered from the saved entry (8): the last result stays meanwhile.
    expect(shown()).toBe("9 mine");
    expect(calls.map((call) => call.filter)).toEqual(["all", "mine"]);
    calls[1]!.resolve({ total: 10 });
    await settle(600);
    expect(shown()).toBe("10 mine");
    expect(calls).toHaveLength(2);
    expect(first.saved.mock.calls).toEqual([
      ["a", { key: ALL, value: result(9) }],
      ["a", { key: MINE, value: result(10) }],
      ["a", { key: "$state", value: state("mine") }],
    ]);

    await act(async () => root.unmount());
    root = createRoot(container);
    calls = [];
    const entries = Object.fromEntries(first.saved.mock.calls.map(([, e]) => [e.key, e.value]));
    await show(cloud(async () => entries).storage);
    expect(shown()).toBe("10 mine");
    expect(calls.map((call) => call.filter)).toEqual(["mine"]);
  });

  it("a change still waiting is saved when the dashboard goes away", async () => {
    const c = cloud(async () => ({}));
    await show(c.storage);
    await act(async () => setFilter("mine"));
    await act(async () => root.unmount());
    root = createRoot(container);
    expect(c.saved.mock.calls).toEqual([["a", { key: "$state", value: state("mine") }]]);
    await sleep(600);
    expect(c.saved).toHaveBeenCalledTimes(1);
  });

  it("state saved for another version is not restored", async () => {
    const c = cloud(async () => ({ $state: state("mine", "v0") }));
    await show(c.storage);
    expect(shown()).toBe("0 all");
    expect(calls.map((call) => call.filter)).toEqual(["all"]);
  });

  it("the app's initialState wins over the saved state", async () => {
    const c = cloud(async () => ({ $state: state("mine") }));
    await show(c.storage, { initialState: { $filter: "team" } });
    expect(shown()).toBe("0 team");
    expect(calls.map((call) => call.filter)).toEqual(["team"]);
  });

  it("a storage that keeps no results shows the dashboard at once, on its defaults, and saves nothing", async () => {
    const c = cloud();
    const onStateUpdate = vi.fn();
    await show(c.storage, { onStateUpdate });
    expect(shown()).toBe("0 all");
    expect(calls.map((call) => call.filter)).toEqual(["all"]);
    await act(async () => setFilter("mine"));
    await settle(600);
    expect(onStateUpdate).toHaveBeenLastCalledWith({ $filter: "mine" });
    expect(c.saved).not.toHaveBeenCalled();
  });

  it("a slow read holds the dashboard for 400 ms at most; it then opens on its defaults and stays on them", async () => {
    let arrive!: (entries: Entries) => void;
    const c = cloud(() => new Promise<Entries>((resolve) => (arrive = resolve)));
    await show(c.storage);
    expect(shown()).toBeUndefined();
    expect(calls).toHaveLength(0);
    await settle(400);
    expect(shown()).toBe("0 all");
    expect(calls.map((call) => call.filter)).toEqual(["all"]);

    // The late result is still shown; the late state is not applied.
    arrive({ $state: state("mine"), [ALL]: result(7) });
    await settle();
    expect(shown()).toBe("7 all");
    expect(calls).toHaveLength(1);
    expect(c.read).toHaveBeenCalledTimes(1);
  });
});
