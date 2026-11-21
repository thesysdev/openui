import { ChatProvider, type Message } from "@openuidev/react-headless";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMockLLM } from "../../../__test-helpers/mockChat";
import { Messages } from "../Thread";

// The chat store's server snapshot is its initial (empty) state, so the thread
// the components read is supplied here instead.
const thread = vi.hoisted(() => ({
  messages: [] as unknown[],
  isRunning: false,
  isLoadingMessages: false,
  threadError: null,
}));

vi.mock("@openuidev/react-headless", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@openuidev/react-headless")>();
  return {
    ...actual,
    useThread: (selector: (s: typeof thread) => unknown) => selector(thread),
  };
});

const render = (messages: Message[], isRunning: boolean) => {
  thread.messages = messages;
  thread.isRunning = isRunning;
  return renderToString(
    <ChatProvider llm={makeMockLLM()}>
      <Messages />
    </ChatProvider>,
  );
};

const user: Message = { id: "u1", role: "user", content: "What is 2 + 2?" };
const reasoning: Message = { id: "r1", role: "reasoning", content: "Adding two and two" };

describe("Messages SSR: reasoning", () => {
  beforeEach(() => {
    thread.messages = [];
    thread.isRunning = false;
  });

  it("streams reasoning open while it is the only thing the model has produced", () => {
    const html = render([user, reasoning], true);
    expect(html).toContain("Adding two and two");
    expect(html).toContain("Thinking");
    expect(html).toContain("openui-behind-the-scenes__collapse--open");
  });

  it("folds reasoning away once the answer starts streaming", () => {
    const html = render(
      [user, reasoning, { id: "a1", role: "assistant", content: 'root = TextContent("4")' }],
      true,
    );
    expect(html).toContain("Thought it through");
    expect(html).not.toContain("Adding two and two");
    expect(html).not.toContain("openui-behind-the-scenes__collapse--open");
    expect(html).toContain("TextContent");
  });

  it("keeps a settled turn's reasoning behind the timeline, above the answer", () => {
    const html = render(
      [user, reasoning, { id: "a1", role: "assistant", content: "The answer is 4." }],
      false,
    );
    expect(html).toContain("Behind the scenes");
    expect(html).toContain("Thought it through");
    expect(html).not.toContain("Adding two and two");
    expect(html.indexOf("Behind the scenes")).toBeLessThan(html.indexOf("The answer is 4."));
  });

  it("renders no timeline for a turn without reasoning or tools", () => {
    const html = render(
      [user, { id: "a1", role: "assistant", content: "The answer is 4." }],
      false,
    );
    expect(html).toContain("The answer is 4.");
    expect(html).not.toContain("openui-behind-the-scenes");
  });
});
