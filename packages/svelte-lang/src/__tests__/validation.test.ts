import { describe, it, expect } from "vitest";
import {
	builtInValidators,
	parseRules,
	parseStructuredRules,
	validate,
} from "../lib/validation.svelte.js";

// ─── builtInValidators ──────────────────────────────────────────────────────

describe("builtInValidators", () => {
	it("has all expected validators", () => {
		const expected = [
			"required",
			"email",
			"url",
			"numeric",
			"min",
			"max",
			"minLength",
			"maxLength",
			"pattern",
		];
		for (const name of expected) {
			expect(builtInValidators[name]).toBeDefined();
			expect(typeof builtInValidators[name]).toBe("function");
		}
	});
});

// ─── parseRules ─────────────────────────────────────────────────────────────

describe("parseRules", () => {
	it("parses simple rule strings into ParsedRule objects", () => {
		const result = parseRules(["required", "email"]);
		expect(result).toEqual([{ type: "required" }, { type: "email" }]);
	});

	it("parses rules with numeric arguments", () => {
		const result = parseRules(["min:8", "maxLength:100"]);
		expect(result).toEqual([
			{ type: "min", arg: 8 },
			{ type: "maxLength", arg: 100 },
		]);
	});

	it("parses rules with string arguments", () => {
		const result = parseRules(["pattern:^[a-z]+"]);
		expect(result).toEqual([{ type: "pattern", arg: "^[a-z]+" }]);
	});

	it("returns an empty array for non-array input", () => {
		expect(parseRules(null)).toEqual([]);
		expect(parseRules(undefined)).toEqual([]);
		expect(parseRules("required")).toEqual([]);
	});

	it("filters out non-string entries", () => {
		const result = parseRules(["required", 42, null, "email"]);
		expect(result).toEqual([{ type: "required" }, { type: "email" }]);
	});
});

// ─── validate ───────────────────────────────────────────────────────────────

describe("validate", () => {
	it("returns error string for required on empty value", () => {
		const rules = [{ type: "required" }];
		const error = validate("", rules);
		expect(error).toBe("This field is required");
	});

	it("returns undefined when valid value passes required", () => {
		const rules = [{ type: "required" }];
		expect(validate("hello", rules)).toBeUndefined();
	});

	it("validates email format", () => {
		const rules = [{ type: "email" }];
		expect(validate("bad-email", rules)).toBe("Please enter a valid email");
		expect(validate("test@email.com", rules)).toBeUndefined();
	});

	it("validates min/max with numeric arguments", () => {
		expect(validate(3, [{ type: "min", arg: 5 }])).toBe("Must be at least 5");
		expect(validate(10, [{ type: "min", arg: 5 }])).toBeUndefined();
		expect(validate(20, [{ type: "max", arg: 10 }])).toBe("Must be no more than 10");
		expect(validate(5, [{ type: "max", arg: 10 }])).toBeUndefined();
	});

	it("stops on first error with multiple rules", () => {
		const rules = [{ type: "required" }, { type: "email" }];
		// Empty string triggers "required" first, not "email"
		expect(validate("", rules)).toBe("This field is required");
	});

	it("returns undefined when no rules match", () => {
		expect(validate("anything", [{ type: "nonExistentRule" }])).toBeUndefined();
	});
});

// ─── parseStructuredRules ───────────────────────────────────────────────────

describe("parseStructuredRules", () => {
	it("parses an object of rules into ParsedRule array", () => {
		const result = parseStructuredRules({ required: true, minLength: 5 });
		expect(result).toContainEqual({ type: "required" });
		expect(result).toContainEqual({ type: "minLength", arg: 5 });
	});

	it("skips false/undefined/null values", () => {
		const result = parseStructuredRules({
			required: true,
			email: false,
			max: undefined,
			min: null,
		});
		expect(result).toEqual([{ type: "required" }]);
	});

	it("returns empty array for non-object input", () => {
		expect(parseStructuredRules(null)).toEqual([]);
		expect(parseStructuredRules(undefined)).toEqual([]);
		expect(parseStructuredRules([])).toEqual([]);
		expect(parseStructuredRules("string")).toEqual([]);
	});
});
