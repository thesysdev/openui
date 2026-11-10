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
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { LiveArtifactRenderer } from "../ArtifactRenderer";
import type { ArtifactError } from "../errors";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const llm = { send: vi.fn(), streamProtocol: { parse: async function* () {} } } as never;

/** Every total the dashboard rendered, in order, and the setter of its `$filter`. */
let renders: number[] = [];
let setFilter: (value: string) => void = () => {};
const Board = defineComponent({
  name: "Board",
  props: z.object({ total: z.number(), filter: reactive(z.string()), other: z.number() }),
  description: "Board",
  component: ({ props }) => {
    const filter = useStateField("filter", props.filter);
    setFilter = filter.setValue;
    renders.push(props.total);
    return createElement("output", null, `${props.total} ${filter.value} ${props.other}`);
  },
});
const library = createLibrary({ root: "Board", components: [Board] });
/** One query, two queries, and one query that reads `$filter`. */
const ONE =
  '$filter = "all"\nroot = Board(q.total, $filter, 0)\nq = Query("totals", {}, {total: 0})';
const TWO = `${ONE.replace(", 0)", ", r.total)")}\nr = Query("slow", {}, {total: 0})`;
/** `r` reads `q`'s result. */
const DEPENDENT = TWO.replace('"slow", {}', '"slow", {n: q.total}');
const FILTERED = ONE.replace('"totals", {}', '"totals", {filter: $filter}');
const stored = (results: Record<string, unknown>, version = "v1") => ({ version, results });
type Read = NonNullable<ArtifactStorage["getQueryResults"]>;

/** An artifact storage that serves `program` at `version`. */
function cloud(program: string, getQueryResults: Read, version = "v1") {
  const read = vi.fn(getQueryResults);
  const putQueryResults = vi.fn();
  const artifact = {
    list: async () => ({ artifacts: [] }),
    get: async () => ({}),
    update: async () => ({}),
    async *stream(id: string): AsyncIterable<ArtifactStreamEvent> {
      yield { type: "reference", data: { id, version } };
      yield { type: "delta", data: { text: program } };
      await sleep(5);
      yield { type: "end" };
    },
    getQueryResults: read,
    putQueryResults,
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
  return { storage, read, saved: putQueryResults };
}

describe("ArtifactRendererRoot last results", () => {
  let root: Root;
  let container: HTMLDivElement;
  /** The interpreter's calls, each waiting to be answered. */
  let calls: Array<{ name: string; resolve: (r: unknown) => void; reject: (e: Error) => void }>;
  let errors: Array<OpenUIError | ArtifactError>;
  const shown = () => container.querySelector("output")?.textContent;
  /** How often the queries ran again: each time starts with a render without results. */
  const refreshes = () => renders.filter((t, i) => t === null && renders[i - 1] !== null).length;
  const both = { "totals::{}": { total: 7 }, "slow::{}": { total: 5 } };
  const answer = async (name: string, result: unknown) => {
    calls.find((call) => call.name === name)!.resolve(result);
    await settle();
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.spyOn(console, "error").mockImplementation(() => {});
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    renders = [];
    calls = [];
    errors = [];
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const settle = async () => {
    for (let i = 0; i < 12; i++) {
      await act(async () => {
        await sleep(5);
      });
    }
  };

  const renderer = (props: Record<string, unknown>) => (
    <LiveArtifactRenderer
      id="a"
      library={library}
      interpreter={({ name }) =>
        new Promise((resolve, reject) => calls.push({ name, resolve, reject }))
      }
      onError={(next) => (errors = next)}
      {...props}
    />
  );
  const panel = renderer({ key: "panel", preview: false });
  /** A thread's card: open, but its content is shown elsewhere. */
  const card = renderer({ key: "card", isOpen: true, renderInHtmlElement: null });

  async function show(storage: ChatStorage, ...children: ReactNode[]) {
    await act(async () => {
      root.render(
        <ChatProvider llm={llm} storage={storage}>
          {children}
        </ChatProvider>,
      );
    });
    await settle();
  }

  it("a first open makes one call per query and saves each result as it arrives", async () => {
    const c = cloud(TWO, async () => ({ results: {} }));
    await show(c.storage, panel);
    renders = [];
    await answer("totals", { total: 7 });
    expect(c.saved.mock.calls).toEqual([["a", stored({ "totals::{}": { total: 7 } })]]);
    await answer("slow", { total: 5 });
    expect(shown()).toBe("7 all 5");
    expect(calls.map((call) => call.name)).toEqual(["totals", "slow"]);
    expect(c.saved.mock.calls[1]).toEqual(["a", stored(both)]);
    expect(c.saved).toHaveBeenCalledTimes(2);
    expect(refreshes()).toBe(0);
  });

  it("a reopened dashboard shows the stored result, then the fresh one, with one call and its state kept", async () => {
    const c = cloud(ONE, async () => stored({ "totals::{}": { total: 7 } }));
    await show(c.storage, panel);
    expect(shown()).toBe("7 all 0");
    await act(async () => setFilter("mine"));

    await answer("totals", { total: 9 });
    expect(shown()).toBe("9 mine 0");
    expect(calls).toHaveLength(1);
    expect(c.saved.mock.calls).toEqual([["a", stored({ "totals::{}": { total: 9 } })]]);
  });

  it("each tile shows its fresh result as soon as it arrives, with one call per query", async () => {
    const c = cloud(TWO, async () => stored(both));
    await show(c.storage, panel);
    expect(shown()).toBe("7 all 5");
    renders = [];
    await answer("totals", { total: 9 });
    expect(shown()).toBe("9 all 5");
    expect(c.saved.mock.calls).toEqual([["a", stored({ "totals::{}": { total: 9 } })]]);
    await answer("slow", { total: 6 });
    expect(shown()).toBe("9 all 6");
    expect(calls.map((call) => call.name)).toEqual(["totals", "slow"]);
    expect(c.saved.mock.calls[1]).toEqual([
      "a",
      stored({ "totals::{}": { total: 9 }, "slow::{}": { total: 6 } }),
    ]);
    expect(refreshes()).toBe(2);
  });

  it("results that arrive in the same frame run the queries again once", async () => {
    const c = cloud(TWO, async () => stored(both));
    await show(c.storage, panel);
    renders = [];
    calls[0]!.resolve({ total: 9 });
    await answer("slow", { total: 6 });
    expect(shown()).toBe("9 all 6");
    expect(calls).toHaveLength(2);
    expect(refreshes()).toBe(1);
    expect(c.saved).toHaveBeenCalledTimes(1);
  });

  it("a query that reads another's result is saved on a first open and shown on a reopen", async () => {
    const first = cloud(DEPENDENT, async () => ({ results: {} }));
    await show(first.storage, panel);
    await answer("totals", { total: 7 });
    await answer("slow", { total: 5 });
    expect(shown()).toBe("7 all 5");
    const saved = first.saved.mock.calls.at(-1)![1];
    expect(saved).toEqual(stored({ "totals::{}": { total: 7 }, 'slow::{"n":7}': { total: 5 } }));

    await act(async () => root.unmount());
    root = createRoot(container);
    calls = [];
    await show(cloud(DEPENDENT, async () => saved).storage, panel);
    expect(shown()).toBe("7 all 5");
    await answer("totals", { total: 7 });
    expect(shown()).toBe("7 all 5");
    await answer("slow", { total: 6 });
    expect(shown()).toBe("7 all 6");
    expect(calls.map((call) => call.name)).toEqual(["totals", "slow"]);
  });

  it("stored results that arrive after the query started are shown; after the fresh result, never", async () => {
    let arrive!: (results: ReturnType<typeof stored>) => void;
    const late = () => new Promise<ReturnType<typeof stored>>((resolve) => (arrive = resolve));
    await show(cloud(ONE, late).storage, panel);
    expect(shown()).toBe("0 all 0");
    arrive(stored({ "totals::{}": { total: 7 } }));
    await settle();
    expect(shown()).toBe("7 all 0");
    await answer("totals", { total: 9 });
    expect(shown()).toBe("9 all 0");
    expect(calls).toHaveLength(1);

    await act(async () => root.unmount());
    root = createRoot(container);
    renders = [];
    calls = [];
    await show(cloud(ONE, late).storage, panel);
    await answer("totals", { total: 9 });
    arrive(stored({ "totals::{}": { total: 7 } }));
    await settle();
    expect(shown()).toBe("9 all 0");
    expect(renders).not.toContain(7);
    expect(calls).toHaveLength(1);
  });

  it("a panel opened from a card, with the program already loaded, shows the stored result", async () => {
    const c = cloud(ONE, async () => stored({ "totals::{}": { total: 7 } }));
    await show(c.storage, card);
    expect(c.read).not.toHaveBeenCalled();
    await show(c.storage, card, panel);
    expect(shown()).toBe("7 all 0");
    expect(c.read).toHaveBeenCalledTimes(1);
  });

  it("a failed call shows the error for its query while the other keeps working", async () => {
    const c = cloud(TWO, async () => stored(both));
    await show(c.storage, panel);
    calls[0]!.reject(new Error("down"));
    await settle();
    expect(shown()).toBe("0 all 5");
    expect(errors.map((error) => error.code)).toEqual(["tool-error"]);
    await answer("slow", { total: 6 });
    expect(shown()).toBe("0 all 6");
    expect(calls).toHaveLength(2);
    expect(c.saved.mock.calls).toEqual([["a", stored({ "slow::{}": { total: 6 } })]]);
  });

  it("results stored for another version are ignored", async () => {
    const c = cloud(ONE, async () => stored({ "totals::{}": { total: 7 } }), "v2");
    await show(c.storage, panel);
    expect(shown()).toBe("0 all 0");
    await answer("totals", { total: 9 });
    expect(shown()).toBe("9 all 0");
    expect(calls).toHaveLength(1);
    expect(renders).not.toContain(7);
  });

  it("a closed preview card and a card without content neither read nor write", async () => {
    const c = cloud(ONE, async () => stored({ "totals::{}": { total: 7 } }));
    await show(c.storage, renderer({ key: "closed" }), card);
    expect(calls).toHaveLength(0);
    expect(c.read).not.toHaveBeenCalled();
    expect(c.saved).not.toHaveBeenCalled();
  });

  it("after the first batch, a call is real even if its result is stored: not shown, not saved, no re-run", async () => {
    const all = 'totals::{"filter":"all"}';
    const mine = 'totals::{"filter":"mine"}';
    const c = cloud(FILTERED, async () => stored({ [all]: { total: 7 }, [mine]: { total: 8 } }));
    await show(c.storage, panel);
    await answer("totals", { total: 9 });
    expect(shown()).toBe("9 all 0");
    renders = [];

    await act(async () => setFilter("mine"));
    await settle();
    expect(renders).not.toContain(8);
    calls[1]!.resolve({ total: 10 });
    await settle();
    expect(shown()).toBe("10 mine 0");
    expect(calls).toHaveLength(2);
    expect(c.saved.mock.calls).toEqual([["a", stored({ [all]: { total: 9 } })]]);
  });
});
