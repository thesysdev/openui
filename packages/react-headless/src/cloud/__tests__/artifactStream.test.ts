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

  it("treats the stream's own version as seen, so noting it again changes nothing", async () => {
    const storage = storageWith({ v1: "root = A" });
    const store = new ArtifactStreamStore({ ...unused, ...storage });
    store.subscribe("a1", () => {});
    store.noteVersion("a1", "v1");
    await tick();
    store.noteVersion("a1", "v1");
    await tick();
    expect(storage.connections).toEqual(["v1"]);
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

  it("refresh reads the artifact again when no stream is running", async () => {
    const storage = storageWith({ v1: "root = A", v2: "root = B" });
    const store = new ArtifactStreamStore({ ...unused, ...storage });
    store.subscribe("a1", () => {});
    await tick();
    storage.current = "v2";
    store.refresh("a1");
    await tick();
    expect(store.getSnapshot("a1")).toMatchObject({ program: "root = B", version: "v2" });
    expect(storage.connections).toEqual(["v1", "v2"]);
  });

  it("refresh during a stream in progress reads the artifact again after it ends", async () => {
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
    store.refresh("a1");
    await tick();
    expect(connections).toEqual(["v1"]);
    expect(store.getSnapshot("a1").isStreaming).toBe(true);

    release();
    await tick();
    expect(connections).toEqual(["v1", "v2"]);
    expect(store.getSnapshot("a1")).toMatchObject({
      program: "root = v2",
      version: "v2",
      isStreaming: false,
    });
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

  it("doesn't hold a card's queries when the storage has no stream, so no version", async () => {
    const storage: ArtifactStorage = {
      ...unused,
      get: async () => ({ id: "a1", content: "root = A" }) as unknown as Artifact,
    };
    const { A, B } = await openThenMountCard(storage);
    expect(A).toMatchObject({ program: "root = A", isStreaming: false });
    expect(B).toMatchObject({ program: "root = A", isStreaming: false });
  });

  it("doesn't hold a card's queries when the stream's reference has no version", async () => {
    const storage: ArtifactStorage = {
      ...unused,
      async *stream(id: string): AsyncIterable<ArtifactStreamEvent> {
        yield { type: "reference", data: { id } };
        yield { type: "delta", data: { text: "root = A" } };
        yield { type: "end" };
      },
    };
    const { A, B } = await openThenMountCard(storage);
    expect(A).toMatchObject({ program: "root = A", isStreaming: false });
    expect(B).toMatchObject({ program: "root = A", isStreaming: false });
  });

  it("two renderers refused together share one re-read", async () => {
    const storage = storageWith({ v1: "root = A", v2: "root = B" });
    await openThenMountCard({ ...unused, ...storage });
    storage.current = "v2";
    let answers: string[] = [];
    await act(async () => {
      answers = await Promise.all([
        states.A!.reportVersionMismatch!("v1"),
        states.B!.reportVersionMismatch!("v1"),
      ]);
    });
    expect(answers).toEqual(["rerun", "rerun"]);
    expect(storage.connections).toEqual(["v1", "v2"]);
    expect(states.A).toMatchObject({ version: "v2" });
    expect(states.B).toMatchObject({ version: "v2" });
  });

  it("an artifact in your own storage has nothing to report", async () => {
    await act(async () => {
      root.render(createElement(OwnContent));
    });
    expect(ownState?.reportVersionMismatch).toBeUndefined();
  });
});

let ownState: ArtifactStreamState | undefined;
function OwnContent() {
  ownState = useArtifactStream({ id: "a1", content: "root = A" });
  return null;
}
