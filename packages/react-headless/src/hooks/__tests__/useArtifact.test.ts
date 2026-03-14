import { describe, expect, it } from "vitest";
import { createArtifactStore } from "../../store/createArtifactStore";

describe("useArtifact behavior (store-level)", () => {
  it("isActive reflects whether artifactId matches activeArtifactId", () => {
    const store = createArtifactStore();

    expect(store.getState().activeArtifactId === "art-1").toBe(false);

    store.getState().openArtifact("art-1");
    expect(store.getState().activeArtifactId === "art-1").toBe(true);

    store.getState().openArtifact("art-2");
    expect(store.getState().activeArtifactId === "art-1").toBe(false);
    expect(store.getState().activeArtifactId === "art-2").toBe(true);
  });

  it("open() adds artifact to store", () => {
    const store = createArtifactStore();

    store.getState().openArtifact("art-1", { title: "Code Editor" });

    expect(store.getState().activeArtifactId).toBe("art-1");
    expect(store.getState().artifacts["art-1"]?.title).toBe("Code Editor");
  });

  it("close() deactivates artifact but preserves entry in registry", () => {
    const store = createArtifactStore();

    store.getState().openArtifact("art-1", { title: "Code Editor" });
    expect(store.getState().activeArtifactId).toBe("art-1");

    store.getState().closeArtifact("art-1");

    expect(store.getState().activeArtifactId).toBeNull();
    expect(Object.keys(store.getState().artifacts).length).toBe(1);
    expect(store.getState().artifacts["art-1"]?.title).toBe("Code Editor");
  });

  it("remove() deletes artifact from registry", () => {
    const store = createArtifactStore();

    store.getState().openArtifact("art-1", { title: "Code Editor" });
    expect(store.getState().activeArtifactId).toBe("art-1");

    store.getState().removeArtifact("art-1");

    expect(store.getState().activeArtifactId).toBeNull();
    expect(Object.keys(store.getState().artifacts).length).toBe(0);
  });

  it("toggle() opens when closed and closes when open", () => {
    const store = createArtifactStore();

    // Toggle open
    const state1 = store.getState();
    if (state1.activeArtifactId === "art-1") {
      state1.closeArtifact("art-1");
    } else {
      state1.openArtifact("art-1");
    }
    expect(store.getState().activeArtifactId).toBe("art-1");

    // Toggle close — entry stays in registry
    const state2 = store.getState();
    if (state2.activeArtifactId === "art-1") {
      state2.closeArtifact("art-1");
    } else {
      state2.openArtifact("art-1");
    }
    expect(store.getState().activeArtifactId).toBeNull();
    expect(Object.keys(store.getState().artifacts).length).toBe(1);
  });

  it("meta returns artifact metadata from store", () => {
    const store = createArtifactStore();

    expect(store.getState().artifacts["art-1"] ?? null).toBeNull();

    store.getState().openArtifact("art-1", { title: "Preview" });

    const meta = store.getState().artifacts["art-1"];
    expect(meta).toBeDefined();
    expect(meta!.id).toBe("art-1");
    expect(meta!.title).toBe("Preview");
  });

  it("triggerProps.aria-expanded matches isActive", () => {
    const store = createArtifactStore();

    const isActiveBefore = store.getState().activeArtifactId === "art-1";
    expect(isActiveBefore).toBe(false);

    store.getState().openArtifact("art-1");

    const isActiveAfter = store.getState().activeArtifactId === "art-1";
    expect(isActiveAfter).toBe(true);
  });
});
