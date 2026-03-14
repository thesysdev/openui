import { describe, expect, it, vi } from "vitest";
import { createArtifactStore } from "../createArtifactStore";
import { createChatStore } from "../createChatStore";

const flushPromises = () => new Promise((r) => setTimeout(r, 0));

describe("artifact thread-switch cleanup", () => {
  const setupStores = () => {
    const chatStore = createChatStore({ processMessage: vi.fn() });
    const artifactStore = createArtifactStore();

    const unsubscribe = chatStore.subscribe(
      (state) => state.selectedThreadId,
      () => artifactStore.getState().resetArtifacts(),
    );

    return { chatStore, artifactStore, unsubscribe };
  };

  it("clears artifacts when selectThread is called", async () => {
    const { chatStore, artifactStore, unsubscribe } = setupStores();

    artifactStore.getState().openArtifact("art-1", { title: "Code" });
    expect(artifactStore.getState().activeArtifactId).toBe("art-1");

    chatStore.getState().selectThread("thread-2");
    await flushPromises();

    expect(artifactStore.getState().activeArtifactId).toBeNull();
    expect(Object.keys(artifactStore.getState().artifacts).length).toBe(0);

    unsubscribe();
  });

  it("clears artifacts when switchToNewThread is called", async () => {
    const { chatStore, artifactStore, unsubscribe } = setupStores();

    chatStore.setState({ selectedThreadId: "thread-1" });
    artifactStore.getState().openArtifact("art-1");

    chatStore.getState().switchToNewThread();
    await flushPromises();

    expect(artifactStore.getState().activeArtifactId).toBeNull();
    expect(Object.keys(artifactStore.getState().artifacts).length).toBe(0);

    unsubscribe();
  });

  it("clears artifacts when active thread is deleted", async () => {
    const deleteThread = vi.fn().mockResolvedValue(undefined);
    const chatStore = createChatStore({ deleteThread, processMessage: vi.fn() });
    const artifactStore = createArtifactStore();

    const unsubscribe = chatStore.subscribe(
      (state) => state.selectedThreadId,
      () => artifactStore.getState().resetArtifacts(),
    );

    chatStore.setState({
      selectedThreadId: "thread-1",
      threads: [
        {
          id: "thread-1",
          title: "Test",
          createdAt: new Date().toISOString(),
        },
      ],
    });

    artifactStore.getState().openArtifact("art-1");

    chatStore.getState().deleteThread("thread-1");
    await flushPromises();

    expect(artifactStore.getState().activeArtifactId).toBeNull();
    expect(Object.keys(artifactStore.getState().artifacts).length).toBe(0);

    unsubscribe();
  });

  it("does not clear artifacts when re-selecting the same thread", async () => {
    const { chatStore, artifactStore, unsubscribe } = setupStores();

    // Set initial thread
    chatStore.setState({ selectedThreadId: "thread-1" });
    await flushPromises();

    // Open artifact after initial subscription fires
    artifactStore.getState().openArtifact("art-1", { title: "Code" });
    expect(artifactStore.getState().activeArtifactId).toBe("art-1");

    // Re-select the same thread
    chatStore.getState().selectThread("thread-1");
    await flushPromises();

    // Artifacts should still be present
    expect(artifactStore.getState().activeArtifactId).toBe("art-1");
    expect(Object.keys(artifactStore.getState().artifacts).length).toBe(1);

    unsubscribe();
  });

  it("handles rapid thread switches cleanly", async () => {
    const loadThread = vi.fn().mockResolvedValue([]);
    const chatStore = createChatStore({ loadThread, processMessage: vi.fn() });
    const artifactStore = createArtifactStore();

    const unsubscribe = chatStore.subscribe(
      (state) => state.selectedThreadId,
      () => artifactStore.getState().resetArtifacts(),
    );

    artifactStore.getState().openArtifact("art-1");

    chatStore.getState().selectThread("thread-1");
    chatStore.getState().selectThread("thread-2");
    chatStore.getState().selectThread("thread-3");
    await flushPromises();

    expect(artifactStore.getState().activeArtifactId).toBeNull();
    expect(Object.keys(artifactStore.getState().artifacts).length).toBe(0);
    expect(chatStore.getState().selectedThreadId).toBe("thread-3");

    unsubscribe();
  });
});
