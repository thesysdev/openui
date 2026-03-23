import { describe, expect, it } from "vitest";
import { createArtifactStore } from "../createArtifactStore";

describe("createArtifactStore", () => {
  it("has correct initial state", () => {
    const store = createArtifactStore();
    const state = store.getState();

    expect(state.activeArtifactId).toBeNull();
    expect(state._artifactPanelNode).toBeNull();
  });

  describe("openArtifact", () => {
    it("sets activeArtifactId", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1");

      expect(store.getState().activeArtifactId).toBe("art-1");
    });

    it("replaces active artifact when opening a different one", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1");
      store.getState().openArtifact("art-2");

      expect(store.getState().activeArtifactId).toBe("art-2");
    });

    it("is idempotent when opening the same artifact", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1");
      store.getState().openArtifact("art-1");

      expect(store.getState().activeArtifactId).toBe("art-1");
    });
  });

  describe("closeArtifact", () => {
    it("clears activeArtifactId when closing the active artifact", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1");
      expect(store.getState().activeArtifactId).toBe("art-1");

      store.getState().closeArtifact("art-1");
      expect(store.getState().activeArtifactId).toBeNull();
    });

    it("no-ops when closing a non-active artifact", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1");
      store.getState().closeArtifact("art-2");

      expect(store.getState().activeArtifactId).toBe("art-1");
    });

    it("no-ops when nothing is active", () => {
      const store = createArtifactStore();

      store.getState().closeArtifact("art-1");

      expect(store.getState().activeArtifactId).toBeNull();
    });
  });

  describe("resetArtifacts", () => {
    it("resets activeArtifactId to null", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1");
      expect(store.getState().activeArtifactId).toBe("art-1");

      store.getState().resetArtifacts();
      expect(store.getState().activeArtifactId).toBeNull();
    });
  });

  describe("_setArtifactPanelNode", () => {
    it("sets and clears DOM reference", () => {
      const store = createArtifactStore();

      const node = {} as HTMLElement;
      store.getState()._setArtifactPanelNode(node);
      expect(store.getState()._artifactPanelNode).toBe(node);

      store.getState()._setArtifactPanelNode(null);
      expect(store.getState()._artifactPanelNode).toBeNull();
    });
  });
});
