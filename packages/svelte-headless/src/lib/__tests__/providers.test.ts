import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { createChatStore } from "../index";
import type { Message } from "../index";
import MessageProviderHarness from "./fixtures/MessageProviderHarness.svelte";
import ThreadProviderHarness from "./fixtures/ThreadProviderHarness.svelte";

describe("@openuidev/svelte-headless", () => {
  it("exposes reactive thread state through ChatProvider context", () => {
    const store = createChatStore({ processMessage: vi.fn() });
    store.setState({
      threads: [{ id: "t1", title: "First", createdAt: new Date().toISOString() }],
    });

    const component = mount(ThreadProviderHarness, {
      target: document.body,
      props: { store },
    });

    flushSync();

    expect(document.body.textContent).toContain("1");

    unmount(component);
  });

  it("exposes message context through MessageProvider", () => {
    const message = {
      id: "m1",
      role: "assistant",
      content: "hello from context",
    } as Message;

    const component = mount(MessageProviderHarness, {
      target: document.body,
      props: { message },
    });

    flushSync();

    expect(document.body.textContent).toContain("hello from context");

    unmount(component);
  });
});
