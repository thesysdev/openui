// @vitest-environment jsdom

import { act, createRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Composer } from "../components/Composer";
import { DesktopWelcomeComposer } from "../components/DesktopWelcomeComposer";

const thread = vi.hoisted(() => ({
  processMessage: vi.fn(),
  cancelMessage: vi.fn(),
  isRunning: false,
  isLoadingMessages: false,
}));

vi.mock("@openuidev/react-headless", () => ({
  useThread: (selector: (state: typeof thread) => unknown) => selector(thread),
  useThreadList: (selector: (state: { selectedThreadId: string }) => unknown) =>
    selector({ selectedThreadId: "thread-1" }),
}));

function ControlledWelcomeComposer() {
  const [value, onChange] = useState("");
  return <DesktopWelcomeComposer value={value} onChange={onChange} />;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  thread.isRunning = false;
  thread.isLoadingMessages = false;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const input = () => container.querySelector("textarea")!;
const button = () => container.querySelector("button")!;

function change(target: HTMLTextAreaElement, value: string, isComposing = false) {
  // Use the native setter so React sees the same value change as a browser input event.
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(target, value);
  target.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      data: value,
      inputType: isComposing ? "insertCompositionText" : "insertText",
      isComposing,
    }),
  );
}

function composition(target: HTMLTextAreaElement, type: "compositionstart" | "compositionend") {
  target.dispatchEvent(new CompositionEvent(type, { bubbles: true, data: target.value }));
}

describe.each([
  ["thread", Composer],
  ["welcome", DesktopWelcomeComposer],
  ["controlled welcome", ControlledWelcomeComposer],
] as const)("%s composer dictation", (_, Component) => {
  beforeEach(() => {
    act(() => root.render(<Component />));
  });

  it.each(["before", "after"] as const)(
    "keeps the sent draft clear when composition ends %s the click",
    (endOrder) => {
      const dictatedInput = input();
      act(() => composition(dictatedInput, "compositionstart"));
      act(() => change(dictatedInput, "Dictated text", true));
      if (endOrder === "before") {
        act(() => composition(dictatedInput, "compositionend"));
      }

      act(() => button().click());
      expect(thread.processMessage).toHaveBeenCalledExactlyOnceWith({
        role: "user",
        content: "Dictated text",
      });
      expect(input().value).toBe("");

      // Model the reported late commit to the input that owned the composition.
      act(() => {
        if (endOrder === "after") composition(dictatedInput, "compositionend");
        change(dictatedInput, "Dictated text");
      });
      expect(input().value).toBe("");

      act(() => change(input(), "Next draft"));
      act(() => change(dictatedInput, "Dictated text"));
      expect(input().value).toBe("Next draft");
      expect(thread.processMessage).toHaveBeenCalledTimes(1);
    },
  );

  it("preserves ordinary input identity and keyboard submission", () => {
    const ordinaryInput = input();
    act(() => change(ordinaryInput, "Typed text"));
    const newline = new KeyboardEvent("keydown", {
      key: "Enter",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    act(() => ordinaryInput.dispatchEvent(newline));
    expect(newline.defaultPrevented).toBe(false);
    expect(thread.processMessage).not.toHaveBeenCalled();

    act(() =>
      ordinaryInput.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      ),
    );
    expect(thread.processMessage).toHaveBeenCalledExactlyOnceWith({
      role: "user",
      content: "Typed text",
    });
    expect(input()).toBe(ordinaryInput);
    expect(input().value).toBe("");
  });

  it.each(["input", "button"] as const)("preserves focus on the %s after Send", (focusTarget) => {
    act(() => composition(input(), "compositionstart"));
    act(() => change(input(), "Dictated text", true));
    const focused = focusTarget === "input" ? input() : button();
    focused.focus();
    act(() => button().click());
    expect(document.activeElement).toBe(focusTarget === "input" ? input() : focused);
  });

  it("resets each submitted composition without replacing later ordinary drafts", () => {
    for (const text of ["First dictation", "Second dictation"]) {
      const previousInput = input();
      act(() => composition(previousInput, "compositionstart"));
      act(() => change(previousInput, text, true));
      act(() => button().click());
      act(() => change(previousInput, text));
      expect(input().value).toBe("");
    }

    const ordinaryInput = input();
    act(() => change(ordinaryInput, "Typed follow-up"));
    act(() => button().click());
    expect(input()).toBe(ordinaryInput);
    expect(input().value).toBe("");
    expect(thread.processMessage).toHaveBeenCalledTimes(3);
  });

  it("does not reset an empty composing draft", () => {
    const emptyInput = input();
    act(() => composition(emptyInput, "compositionstart"));
    act(() => change(emptyInput, "   ", true));
    act(() => button().click());
    expect(thread.processMessage).not.toHaveBeenCalled();
    expect(input()).toBe(emptyInput);
    expect(input().value).toBe("   ");
  });

  it("keeps the draft when Send is blocked by loading", () => {
    const dictatedInput = input();
    act(() => composition(dictatedInput, "compositionstart"));
    act(() => change(dictatedInput, "Dictated text", true));
    thread.isLoadingMessages = true;
    act(() => root.render(<Component />));
    act(() => button().click());
    expect(thread.processMessage).not.toHaveBeenCalled();
    expect(input()).toBe(dictatedInput);
    expect(input().value).toBe("Dictated text");
  });

  it("keeps the composing draft when cancelling a running response", () => {
    const dictatedInput = input();
    act(() => composition(dictatedInput, "compositionstart"));
    act(() => change(dictatedInput, "Next question", true));
    thread.isRunning = true;
    act(() => root.render(<Component />));
    act(() => button().click());
    expect(thread.cancelMessage).toHaveBeenCalledTimes(1);
    expect(thread.processMessage).not.toHaveBeenCalled();
    expect(input()).toBe(dictatedInput);
    expect(input().value).toBe("Next question");
  });
});

it("updates the welcome composer's external input ref after a dictated submission", () => {
  const inputRef = createRef<HTMLTextAreaElement>();
  act(() => root.render(<DesktopWelcomeComposer inputRef={inputRef} />));
  const previousInput = inputRef.current!;
  act(() => composition(previousInput, "compositionstart"));
  act(() => change(previousInput, "Dictated text", true));
  act(() => button().click());
  expect(inputRef.current).toBe(input());
  expect(inputRef.current).not.toBe(previousInput);
  expect(inputRef.current!.isConnected).toBe(true);
});
