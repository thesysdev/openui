import { describe, expect, it } from "vitest";
import {
  ComposerKeyDownEvent,
  isCommitEnter,
  isStaleComposition,
  shouldSubmitOnEnter,
} from "../_shared/utils/composerKeyboard";
import { STOP_WINDOW_MS } from "../_shared/utils/useComposerComposition";

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

  it("does not submit while a true IME composition is open (isComposing)", () => {
    expect(shouldSubmitOnEnter(keyDown({ nativeEvent: { isComposing: true } }))).toBe(false);
  });

  it("does not submit when the browser reports the IME sentinel keyCode 229", () => {
    // Safari and older Chromium leave isComposing unset on this keydown.
    expect(shouldSubmitOnEnter(keyDown({ keyCode: 229 }))).toBe(false);
  });

  it("submits on the Enter that follows a finished composition", () => {
    expect(shouldSubmitOnEnter(keyDown({ nativeEvent: { isComposing: false } }))).toBe(true);
  });

  it("blocks a fast Enter mid-dictation when the tracked composition ref is set", () => {
    // Windows Voice Typing (Win+H) can report isComposing: false and keyCode 13
    // on the fast Enter even though dictation is still composing. The
    // onCompositionStart/End ref stays true across that window, so it must win.
    // First Enter commits, second sends.
    expect(shouldSubmitOnEnter(keyDown(), true)).toBe(false);
  });

  it("allows Enter once the tracked composition ends", () => {
    expect(shouldSubmitOnEnter(keyDown(), false)).toBe(true);
  });
});

describe("isCommitEnter", () => {
  it("detects a native composing Enter as the commit keystroke", () => {
    expect(isCommitEnter(keyDown({ nativeEvent: { isComposing: true } }))).toBe(true);
  });

  it("detects the 229 sentinel as the commit keystroke", () => {
    expect(isCommitEnter(keyDown({ keyCode: 229 }))).toBe(true);
  });

  it("detects a stale-timing voice Enter via the tracked ref", () => {
    expect(isCommitEnter(keyDown(), true)).toBe(true);
  });

  it("does not treat a plain Enter as a commit", () => {
    expect(isCommitEnter(keyDown())).toBe(false);
  });

  it("never commits on Shift+Enter", () => {
    expect(isCommitEnter(keyDown({ shiftKey: true }), true)).toBe(false);
  });
});

describe("isStaleComposition", () => {
  it("keeps new typing with no active composition", () => {
    expect(isStaleComposition(null, 0)).toBe(false);
  });

  it("keeps a composition started after the last submit", () => {
    expect(isStaleComposition(2, 2)).toBe(false);
  });

  it("swallows a late echo from a pre-submit dictation session", () => {
    expect(isStaleComposition(0, 1)).toBe(true);
  });

  it("stays clear across successive dictation rounds", () => {
    let submitGen = 0;
    for (let round = 0; round < 5; round += 1) {
      const startSubmitGen = submitGen;
      expect(isStaleComposition(startSubmitGen, submitGen)).toBe(false);
      submitGen += 1;
      expect(isStaleComposition(startSubmitGen, submitGen)).toBe(true);
    }
  });
});

describe("STOP_WINDOW_MS", () => {
  it("keeps the trailing-tail silence at the agreed 1500ms", () => {
    expect(STOP_WINDOW_MS).toBe(1500);
  });
});
