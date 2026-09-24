import { createParser } from "@openuidev/lang-core";
import assert from "node:assert/strict";
import { test } from "node:test";
import spec from "../src/generated/spec.json";
import { exampleProgram } from "../src/lib/example-program";
import { dashboardPrompt } from "../src/lib/prompt";

test("example parses against the published component schema", () => {
  const parsed = createParser(spec.schema).parse(exampleProgram);
  assert.deepEqual(parsed.meta.errors, []);
  assert.deepEqual(parsed.meta.unresolved, []);
  assert.equal(parsed.root?.typeName, "Stack");
});
test("server prompt includes reactive tools and exact Select signature", () => {
  const prompt = dashboardPrompt(["All countries", "Germany"]);
  assert.ok(prompt.includes("Select(name: string, items:"));
  assert.ok(prompt.includes("sales_dashboard"));
  assert.ok(prompt.includes("$country"));
});
