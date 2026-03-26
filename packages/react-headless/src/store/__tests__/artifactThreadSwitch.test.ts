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

  it("clears active artifact when selectThread is called", async () => {
    const { chatStore, artifactStore, unsubscribe } = setupStores();

    artifactStore.getState().openArtifact("art-1");
    expect(artifactStore.getState().activeArtifactId).toBe("art-1");

    chatStore.getState().selectThread("thread-2");
    await flushPromises();

    expect(artifactStore.getState().activeArtifactId).toBeNull();

    unsubscribe();
  });

  it("clears active artifact when switchToNewThread is called", async () => {
    const { chatStore, artifactStore, unsubscribe } = setupStores();

    chatStore.setState({ selectedThreadId: "thread-1" });
    artifactStore.getState().openArtifact("art-1");

    chatStore.getState().switchToNewThread();
    await flushPromises();

    expect(artifactStore.getState().activeArtifactId).toBeNull();

    unsubscribe();
  });

  it("clears active artifact when active thread is deleted", async () => {
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

    unsubscribe();
  });

  it("does not clear active artifact when re-selecting the same thread", async () => {
    const { chatStore, artifactStore, unsubscribe } = setupStores();

    chatStore.setState({ selectedThreadId: "thread-1" });
    await flushPromises();

    artifactStore.getState().openArtifact("art-1");
    expect(artifactStore.getState().activeArtifactId).toBe("art-1");

    chatStore.getState().selectThread("thread-1");
    await flushPromises();

    expect(artifactStore.getState().activeArtifactId).toBe("art-1");

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
    expect(chatStore.getState().selectedThreadId).toBe("thread-3");

    unsubscribe();
  });
});
