import { describe, expect, it } from "vitest";
import { createFormValidation, parseRules } from "./validation";

describe("angular-lang validation helpers", () => {
  it("validates a single field and stores the error", () => {
    const validation = createFormValidation();
    const rules = parseRules(["required", "minLength:3"]);

    expect(validation.validateField("name", "ab", rules)).toBe(false);
    expect(validation.getFieldError("name")).toBeDefined();

    expect(validation.validateField("name", "abcd", rules)).toBe(true);
    expect(validation.getFieldError("name")).toBeUndefined();
  });

  it("validates all registered fields and unwraps stored form values", () => {
    const validation = createFormValidation();

    validation.registerField("email", parseRules(["required"]), () => ({
      value: "",
      componentType: "Input",
    }));

    expect(validation.validateForm()).toBe(false);
    expect(validation.getFieldError("email")).toBeDefined();
  });

  it("clears field errors without replacing the whole validation object", () => {
    const validation = createFormValidation();
    const rules = parseRules(["required"]);

    validation.validateField("city", "", rules);
    expect(validation.getFieldError("city")).toBeDefined();

    validation.clearFieldError("city");
    expect(validation.getFieldError("city")).toBeUndefined();
  });
});
