import { describe, expect, it } from "vitest";
import { coerceDisplayText, displayText, optionalDisplayText } from "../helpers";

describe("display text coercion", () => {
  it("leaves strings unchanged", () => {
    expect(coerceDisplayText("Inbox")).toEqual({
      text: "Inbox",
      coerced: false,
      sourceType: "string",
    });
  });

  it("converts primitive non-string values without exposing object strings", () => {
    expect(displayText(42)).toBe("42");
    expect(displayText(false)).toBe("false");
    expect(displayText(null)).toBe("");
    expect(displayText(undefined)).toBe("");
  });

  it("uses object display fallback keys in priority order", () => {
    expect(coerceDisplayText({ title: "Inbox", text: "Ignored" })).toMatchObject({
      text: "Inbox",
      coerced: true,
      sourceType: "object",
      fallbackKey: "title",
    });
    expect(displayText({ text: "Follow up" })).toBe("Follow up");
    expect(displayText({ label: "Priority" })).toBe("Priority");
    expect(displayText({ value: 7 })).toBe("7");
  });

  it("joins array values using each item's display text", () => {
    expect(displayText(["Inbox", { title: "Archive" }, 3, null])).toBe("Inbox, Archive, 3");
  });

  it("falls back to JSON for unknown object shapes", () => {
    const text = displayText({ foo: "bar" });
    expect(text).toBe('{"foo":"bar"}');
    expect(text).not.toBe("[object Object]");
  });

  it("does not leak [object Object] for circular objects", () => {
    const value: Record<string, unknown> = {};
    value.self = value;
    expect(displayText(value)).toBe("");
  });

  it("returns undefined for optional empty display text", () => {
    expect(optionalDisplayText(null)).toBeUndefined();
    expect(optionalDisplayText("")).toBeUndefined();
    expect(optionalDisplayText({ title: "Inbox" })).toBe("Inbox");
  });
});
