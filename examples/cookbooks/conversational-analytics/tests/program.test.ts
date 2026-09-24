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
test("Cloud receives the matching library schema and static layout examples in supported options", () => {
  const prompt = dashboardPrompt(["All countries", "Germany"]);
  const marker = "]]>openui:config\n";
  assert.ok(prompt.startsWith(marker));
  const config = JSON.parse(prompt.slice(marker.length));
  assert.deepEqual(config.chatLibrary.schema, spec.schema);
  assert.equal(config.chatLibrary.root, "Stack");
  assert.equal(config.chatLibrary.components, undefined);
  assert.deepEqual(config.systemPromptOptions.examples, [exampleProgram]);
  assert.ok(
    config.systemPromptOptions.additionalRules.some((rule: string) => rule.includes("Germany")),
  );
  assert.ok(
    config.systemPromptOptions.additionalRules.some((rule: string) =>
      rule.includes("Responses function tool"),
    ),
  );
  assert.deepEqual(Object.keys(config.systemPromptOptions).sort(), ["additionalRules", "examples"]);
});
