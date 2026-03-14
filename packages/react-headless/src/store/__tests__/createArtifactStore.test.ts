import { describe, expect, it } from "vitest";
import { createArtifactStore } from "../createArtifactStore";

describe("createArtifactStore", () => {
  it("has correct initial state", () => {
    const store = createArtifactStore();
    const state = store.getState();

    expect(state.activeArtifactId).toBeNull();
    expect(Object.keys(state.artifacts).length).toBe(0);
    expect(state._artifactPanelNode).toBeNull();
  });

  describe("openArtifact", () => {
    it("sets activeArtifactId and adds to artifacts registry", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1", { title: "My Artifact" });

      const state = store.getState();
      expect(state.activeArtifactId).toBe("art-1");
      expect(Object.keys(state.artifacts).length).toBe(1);

      const meta = state.artifacts["art-1"];
      expect(meta).toBeDefined();
      expect(meta!.id).toBe("art-1");
      expect(meta!.title).toBe("My Artifact");
      expect(meta!.activatedAt).toBeTypeOf("number");
    });

    it("sets activatedAt to current time", () => {
      const store = createArtifactStore();
      const before = Date.now();

      store.getState().openArtifact("art-1");

      const meta = store.getState().artifacts["art-1"];
      expect(meta!.activatedAt).toBeGreaterThanOrEqual(before);
      expect(meta!.activatedAt).toBeLessThanOrEqual(Date.now());
    });

    it("merges meta when called with already-active ID", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1", { title: "Original" });
      const originalActivatedAt = store.getState().artifacts["art-1"]!.activatedAt;

      store.getState().openArtifact("art-1", { title: "Updated" });

      const meta = store.getState().artifacts["art-1"];
      expect(meta!.title).toBe("Updated");
      expect(meta!.activatedAt).toBe(originalActivatedAt);
      expect(store.getState().activeArtifactId).toBe("art-1");
    });

    it("replaces active artifact when opening a different one", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1", { title: "First" });
      store.getState().openArtifact("art-2", { title: "Second" });

      expect(store.getState().activeArtifactId).toBe("art-2");
      expect(Object.keys(store.getState().artifacts).length).toBe(2);
      expect("art-1" in store.getState().artifacts).toBe(true);
      expect("art-2" in store.getState().artifacts).toBe(true);
    });

    it("preserves existing metadata when re-activating a non-active artifact", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1", { title: "Code" });
      store.getState().openArtifact("art-2", { title: "Preview" });

      expect(store.getState().activeArtifactId).toBe("art-2");
      expect(store.getState().artifacts["art-1"]?.title).toBe("Code");

      // Re-activate art-1 without passing title
      store.getState().openArtifact("art-1");

      const meta = store.getState().artifacts["art-1"];
      expect(store.getState().activeArtifactId).toBe("art-1");
      expect(meta!.title).toBe("Code");
      expect(meta!.activatedAt).toBeTypeOf("number");
    });

    it("merges new meta over existing when re-activating a non-active artifact", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1", { title: "Original" });
      store.getState().openArtifact("art-2");

      store.getState().openArtifact("art-1", { title: "Updated" });

      const meta = store.getState().artifacts["art-1"];
      expect(meta!.title).toBe("Updated");
    });

    it("refreshes activatedAt when re-activating a non-active artifact", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1", { title: "Test" });
      const firstActivation = store.getState().artifacts["art-1"]!.activatedAt;

      store.getState().openArtifact("art-2");
      store.getState().openArtifact("art-1");

      const meta = store.getState().artifacts["art-1"]!;
      expect(meta.title).toBe("Test");
      expect(meta.activatedAt).toBeGreaterThanOrEqual(firstActivation);
    });

    it("works without meta parameter", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1");

      const meta = store.getState().artifacts["art-1"];
      expect(meta!.id).toBe("art-1");
      expect(meta!.title).toBeUndefined();
    });
  });

  describe("closeArtifact", () => {
    it("deactivates artifact but preserves entry in registry", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1", { title: "My Artifact" });
      expect(store.getState().activeArtifactId).toBe("art-1");

      store.getState().closeArtifact("art-1");

      expect(store.getState().activeArtifactId).toBeNull();
      expect(Object.keys(store.getState().artifacts).length).toBe(1);
      expect(store.getState().artifacts["art-1"]?.title).toBe("My Artifact");
    });

    it("does not affect activeArtifactId when closing a non-active artifact", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1", { title: "First" });
      store.getState().openArtifact("art-2", { title: "Second" });
      expect(store.getState().activeArtifactId).toBe("art-2");

      store.getState().closeArtifact("art-1");

      expect(store.getState().activeArtifactId).toBe("art-2");
      expect(Object.keys(store.getState().artifacts).length).toBe(2);
      expect(store.getState().artifacts["art-1"]?.title).toBe("First");
    });

    it("no-ops when closing non-existent artifact", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1");
      store.getState().closeArtifact("art-999");

      expect(store.getState().activeArtifactId).toBe("art-1");
      expect(Object.keys(store.getState().artifacts).length).toBe(1);
    });

    it("allows re-opening a closed artifact with preserved metadata", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1", { title: "Code Editor" });
      store.getState().closeArtifact("art-1");

      expect(store.getState().activeArtifactId).toBeNull();
      expect(store.getState().artifacts["art-1"]?.title).toBe("Code Editor");

      // Re-open without passing title -- metadata is preserved
      store.getState().openArtifact("art-1");

      expect(store.getState().activeArtifactId).toBe("art-1");
      expect(store.getState().artifacts["art-1"]?.title).toBe("Code Editor");
    });
  });

  describe("removeArtifact", () => {
    it("deletes entry from registry and clears activeArtifactId", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1", { title: "My Artifact" });
      expect(store.getState().activeArtifactId).toBe("art-1");

      store.getState().removeArtifact("art-1");

      expect(store.getState().activeArtifactId).toBeNull();
      expect(Object.keys(store.getState().artifacts).length).toBe(0);
    });

    it("does not clear activeArtifactId when removing a non-active artifact", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1");
      store.getState().openArtifact("art-2");
      expect(store.getState().activeArtifactId).toBe("art-2");

      store.getState().removeArtifact("art-1");

      expect(store.getState().activeArtifactId).toBe("art-2");
      expect(Object.keys(store.getState().artifacts).length).toBe(1);
      expect("art-1" in store.getState().artifacts).toBe(false);
    });

    it("no-ops when removing non-existent artifact", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1");
      store.getState().removeArtifact("art-999");

      expect(store.getState().activeArtifactId).toBe("art-1");
      expect(Object.keys(store.getState().artifacts).length).toBe(1);
    });
  });

  describe("resetArtifacts", () => {
    it("resets both activeArtifactId and artifacts registry", () => {
      const store = createArtifactStore();

      store.getState().openArtifact("art-1");
      store.getState().openArtifact("art-2");

      store.getState().resetArtifacts();

      expect(store.getState().activeArtifactId).toBeNull();
      expect(Object.keys(store.getState().artifacts).length).toBe(0);
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
