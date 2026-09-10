import { describe, expect, it } from "vitest";
import { ComposerKeyDownEvent, shouldSubmitOnEnter } from "../_shared/utils/composerKeyboard";

const keyDown = (overrides: Partial<ComposerKeyDownEvent> = {}): ComposerKeyDownEvent => ({
  key: "Enter",
  shiftKey: false,
  keyCode: 13,
  nativeEvent: { isComposing: false },
  ...overrides,
});

describe("shouldSubmitOnEnter", () => {
  it("submits on a plain Enter", () => {
    expect(shouldSubmitOnEnter(keyDown())).toBe(true);
  });

  it("does not submit on Shift+Enter — that inserts a newline", () => {
    expect(shouldSubmitOnEnter(keyDown({ shiftKey: true }))).toBe(false);
  });

  it("ignores keys other than Enter", () => {
    expect(shouldSubmitOnEnter(keyDown({ key: "a", keyCode: 65 }))).toBe(false);
  });

  it("does not submit while an IME composition is open (isComposing)", () => {
    expect(shouldSubmitOnEnter(keyDown({ nativeEvent: { isComposing: true } }))).toBe(false);
  });

  it("does not submit when the browser reports the IME sentinel keyCode 229", () => {
    // Safari and older Chromium leave isComposing unset on this keydown.
    expect(shouldSubmitOnEnter(keyDown({ keyCode: 229 }))).toBe(false);
  });

  it("submits on the Enter that follows a finished composition", () => {
    expect(shouldSubmitOnEnter(keyDown({ nativeEvent: { isComposing: false } }))).toBe(true);
  });
});
