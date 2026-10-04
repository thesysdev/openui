import { describe, expect, it, vi } from "vitest";
import { setDefaultValue } from "./context";

describe("setDefaultValue", () => {
  it("persists a default value when no existing value is present and streaming has finished", () => {
    const setFieldValue = vi.fn();

    setDefaultValue(
      {
        formName: "contact",
        componentType: "Input",
        name: "email",
        existingValue: undefined,
        defaultValue: "hello@example.com",
        isStreaming: false,
      },
      { setFieldValue },
    );

    expect(setFieldValue).toHaveBeenCalledWith(
      "contact",
      "Input",
      "email",
      "hello@example.com",
      false,
    );
  });

  it("does not overwrite an existing value or run during streaming", () => {
    const setFieldValue = vi.fn();

    setDefaultValue(
      {
        formName: "contact",
        componentType: "Input",
        name: "email",
        existingValue: "already-set@example.com",
        defaultValue: "hello@example.com",
        isStreaming: false,
      },
      { setFieldValue },
    );

    setDefaultValue(
      {
        formName: "contact",
        componentType: "Input",
        name: "email",
        existingValue: undefined,
        defaultValue: "hello@example.com",
        isStreaming: true,
      },
      { setFieldValue },
    );

    expect(setFieldValue).not.toHaveBeenCalled();
  });
});
