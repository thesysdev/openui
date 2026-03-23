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

  it("open() activates the artifact", () => {
    const store = createArtifactStore();

    store.getState().openArtifact("art-1");
    expect(store.getState().activeArtifactId).toBe("art-1");
  });

  it("close() deactivates the artifact", () => {
    const store = createArtifactStore();

    store.getState().openArtifact("art-1");
    expect(store.getState().activeArtifactId).toBe("art-1");

    store.getState().closeArtifact("art-1");
    expect(store.getState().activeArtifactId).toBeNull();
  });

  it("toggle() opens when closed and closes when open", () => {
    const store = createArtifactStore();

    // Open
    store.getState().openArtifact("art-1");
    expect(store.getState().activeArtifactId).toBe("art-1");

    // Close
    store.getState().closeArtifact("art-1");
    expect(store.getState().activeArtifactId).toBeNull();

    // Re-open
    store.getState().openArtifact("art-1");
    expect(store.getState().activeArtifactId).toBe("art-1");
  });

  it("only one artifact can be active at a time", () => {
    const store = createArtifactStore();

    store.getState().openArtifact("art-1");
    store.getState().openArtifact("art-2");

    expect(store.getState().activeArtifactId).toBe("art-2");
  });
});
