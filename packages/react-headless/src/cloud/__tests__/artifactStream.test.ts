// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Artifact, ArtifactStorage, ArtifactStreamEvent } from "../../adapters/types";
import { ArtifactStorageContext } from "../../store/ArtifactStorageContext";
import {
  ArtifactStreamStore,
  useArtifactStream,
  type ArtifactStreamState,
} from "../artifactStream";

/** A storage whose `stream` replays one stored version per connection, like OpenUI Cloud after a generation. */
function storageWith(versions: Record<string, string>) {
  const connections: string[] = [];
  const storage = {
    async *stream(id: string): AsyncIterable<ArtifactStreamEvent> {
      const version = storage.current;
      connections.push(version);
      yield { type: "reference", data: { id, version } };
      yield { type: "delta", data: { text: versions[version]! } };
      yield { type: "end" };
    },
    current: Object.keys(versions)[0]!,
    connections,
  } as ArtifactStorage & { current: string; connections: string[] };
  return storage;
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const unused = {
  list: async () => ({ artifacts: [] }),
  get: async () => ({}) as Artifact,
  update: async () => ({}) as Artifact,
};

describe("ArtifactStreamStore", () => {
  it("fetches an edit noted after an artifact was opened by id, without a version", async () => {
    const storage = storageWith({ v1: "root = A", v2: "root = B" });
    const store = new ArtifactStreamStore({ ...unused, ...storage });
    store.subscribe("a1", () => {});
    await tick();
    expect(store.getSnapshot("a1")).toMatchObject({ program: "root = A", version: "v1" });

    // The edit's tool result arrives with the new version, once it's stored.
    storage.current = "v2";
    store.noteVersion("a1", "v2");
    await tick();
    expect(store.getSnapshot("a1")).toMatchObject({
      program: "root = B",
      version: "v2",
      isStreaming: false,
    });
    expect(storage.connections).toEqual(["v1", "v2"]);
  });

  it("awaits a version it has not recorded, until noteVersion records it", async () => {
    const storage = storageWith({ v1: "root = A", v2: "root = B" });
    const store = new ArtifactStreamStore({ ...unused, ...storage });
    expect(store.awaits("a1", "v1")).toBe(false); // nothing shown yet
    store.subscribe("a1", () => {});
    await tick();
    expect(store.awaits("a1", "v1")).toBe(false);
    expect(store.awaits("a1", "v2")).toBe(true);
    storage.current = "v2";
    store.noteVersion("a1", "v2");
    expect(store.awaits("a1", "v2")).toBe(false);
  });
});

describe("ArtifactStreamStore version refusals", () => {
  afterEach(() => vi.restoreAllMocks());

  it("an older version than the one on screen: re-run, no read", async () => {
    const storage = storageWith({ v1: "root = A", v2: "root = B" });
    const store = new ArtifactStreamStore({ ...unused, ...storage });
    store.subscribe("a1", () => {});
    await tick();
    storage.current = "v2";
    store.noteVersion("a1", "v2");
    await tick();
    await expect(store.versionMismatch("a1", "v1")).resolves.toBe("rerun");
    expect(storage.connections).toEqual(["v1", "v2"]);
  });

  it("the version on screen: one re-read shared by every refusal, then re-run on a newer one", async () => {
    const storage = storageWith({ v1: "root = A", v2: "root = B" });
    const store = new ArtifactStreamStore({ ...unused, ...storage });
    store.subscribe("a1", () => {});
    await tick();
    storage.current = "v2"; // edited elsewhere
    const first = store.versionMismatch("a1", "v1");
    const second = store.versionMismatch("a1", "v1"); // another renderer
    expect(second).toBe(first);
    await expect(first).resolves.toBe("rerun");
    expect(storage.connections).toEqual(["v1", "v2"]);
    expect(store.getSnapshot("a1")).toMatchObject({ version: "v2", program: "root = B" });
  });

  it("the same version back is a real mismatch; no other re-read for 10 s", async () => {
    let now = 1_000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const storage = storageWith({ v1: "root = A" });
    const store = new ArtifactStreamStore({ ...unused, ...storage });
    store.subscribe("a1", () => {});
    await tick();
    await expect(store.versionMismatch("a1", "v1")).resolves.toBe("show");
    await expect(store.versionMismatch("a1", "v1")).resolves.toBe("show"); // "Try again"
    expect(storage.connections).toEqual(["v1", "v1"]);
    now += 10_000;
    await expect(store.versionMismatch("a1", "v1")).resolves.toBe("show");
    expect(storage.connections).toEqual(["v1", "v1", "v1"]);
  });

  it("a server whose version changes on every read stops after one re-read", async () => {
    vi.spyOn(performance, "now").mockReturnValue(1_000);
    const connections: string[] = [];
    const storage: ArtifactStorage = {
      ...unused,
      async *stream(id: string): AsyncIterable<ArtifactStreamEvent> {
        const version = `v${connections.length + 1}`;
        connections.push(version);
        yield { type: "reference", data: { id, version } };
        yield { type: "delta", data: { text: `root = ${version}` } };
        yield { type: "end" };
      },
    };
    const store = new ArtifactStreamStore(storage);
    store.subscribe("a1", () => {});
    await tick();
    await expect(store.versionMismatch("a1", "v1")).resolves.toBe("rerun");
    // The re-run is refused for v2, the version the re-read brought.
    await expect(store.versionMismatch("a1", "v2")).resolves.toBe("show");
    await tick();
    expect(connections).toEqual(["v1", "v2"]);
  });

  it("a refusal during a stream is answered after the catch-up read", async () => {
    const connections: string[] = [];
    let current = "v1";
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const storage: ArtifactStorage = {
      ...unused,
      async *stream(id: string): AsyncIterable<ArtifactStreamEvent> {
        const version = current;
        connections.push(version);
        yield { type: "reference", data: { id, version } };
        yield { type: "delta", data: { text: `root = ${version}` } };
        if (connections.length === 1) await gate;
        yield { type: "end" };
      },
    };
    const store = new ArtifactStreamStore(storage);
    store.subscribe("a1", () => {});
    await tick();
    current = "v2";
    const answer = store.versionMismatch("a1", "v1");
    release();
    await expect(answer).resolves.toBe("rerun");
    expect(connections).toEqual(["v1", "v2"]);
  });
});

describe("useArtifactStream", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  const states: Partial<Record<"A" | "B", ArtifactStreamState>> = {};
  function Panel({ name, id, version }: { name: "A" | "B"; id: string; version?: string }) {
    states[name] = useArtifactStream({ id, version });
    return null;
  }

  /** Panel A opens the artifact by id, then card B mounts with the version from its tool result. */
  async function openThenMountCard(storage: ArtifactStorage) {
    const panelA = createElement(Panel, { key: "A", name: "A", id: "a1" });
    await act(async () => {
      root.render(createElement(ArtifactStorageContext.Provider, { value: storage }, panelA));
    });
    await act(async () => {
      await tick();
    });
    const cardB = createElement(Panel, { key: "B", name: "B", id: "a1", version: "v1" });
    await act(async () => {
      root.render(
        createElement(ArtifactStorageContext.Provider, { value: storage }, panelA, cardB),
      );
    });
    await act(async () => {
      await tick();
      await tick();
    });
    return { A: states.A!, B: states.B! };
  }

  it.each<[string, ArtifactStorage]>([
    [
      "the storage has no stream",
      { ...unused, get: async () => ({ id: "a1", content: "root = A" }) as unknown as Artifact },
    ],
    [
      "the stream's reference has no version",
      {
        ...unused,
        async *stream(id: string): AsyncIterable<ArtifactStreamEvent> {
          yield { type: "reference", data: { id } };
          yield { type: "delta", data: { text: "root = A" } };
          yield { type: "end" };
        },
      },
    ],
  ])("doesn't hold a card's queries when %s, so no version is recorded", async (_, storage) => {
    const { A, B } = await openThenMountCard(storage);
    expect(A).toMatchObject({ program: "root = A", isStreaming: false });
    expect(B).toMatchObject({ program: "root = A", isStreaming: false });
  });
});
