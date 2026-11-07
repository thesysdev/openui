import { describe, expect, it } from "vitest";
import { parseStructuredRules, validate, type ValidatorFn } from "../validation";

describe("validate with custom validators", () => {
  it("uses a custom validator for an unknown rule type", () => {
    const even: ValidatorFn = (value) => (Number(value) % 2 === 0 ? undefined : "Must be even");

    expect(validate(3, [{ type: "even" }], { even })).toBe("Must be even");
    expect(validate(4, [{ type: "even" }], { even })).toBeUndefined();
  });

  it("lets a custom validator override a built-in one", () => {
    const required: ValidatorFn = (value) => (value ? undefined : "Custom required message");

    expect(validate("", [{ type: "required" }], { required })).toBe("Custom required message");
  });

  it("falls back to built-ins when no custom validator matches", () => {
    expect(validate("", [{ type: "required" }], {})).toBe("This field is required");
  });

  it("passes the rule argument and validator context through", () => {
    const matches: ValidatorFn = (value, arg, ctx) =>
      value === ctx?.values[String(arg)] ? undefined : "Values do not match";
    const rules = parseStructuredRules({ matches: "password" });

    expect(
      validate(
        "secret",
        rules,
        { matches },
        {
          fieldName: "confirm",
          values: { password: "secret", confirm: "secret" },
        },
      ),
    ).toBeUndefined();
    expect(
      validate(
        "other",
        rules,
        { matches },
        {
          fieldName: "confirm",
          values: { password: "secret", confirm: "other" },
        },
      ),
    ).toBe("Values do not match");
  });

  it("keeps two-argument validators working when a context is passed", () => {
    const legacy: ValidatorFn = (value, arg) => (value === arg ? undefined : "Wrong value");

    expect(
      validate("a", [{ type: "legacy", arg: "a" }], { legacy }, { fieldName: "x", values: {} }),
    ).toBeUndefined();
  });

  it("stops at the first failing rule", () => {
    const never: ValidatorFn = () => "should not run";

    expect(validate("", [{ type: "required" }, { type: "never" }], { never })).toBe(
      "This field is required",
    );
  });
});
