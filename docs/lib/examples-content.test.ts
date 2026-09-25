import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const docsRoot = join(import.meta.dirname, "..");
const catalog = JSON.parse(readFileSync(join(docsRoot, "../examples/examples.json"), "utf8")) as {
  examples: { title: string; path: string }[];
};

const examplesDocs = join(docsRoot, "content/docs/examples");
const pages = readdirSync(examplesDocs)
  .filter((file) => file.endsWith(".mdx"))
  .map((file) => readFileSync(join(examplesDocs, file), "utf8"))
  .join("\n");

describe("examples docs", () => {
  // `openui create --example` reads examples/examples.json, so every entry
  // there needs a matching command on the Examples tab.
  it("lists every example in examples/examples.json", () => {
    const missing = catalog.examples
      .map((example) => example.path.split("/").at(-1))
      .filter((name) => !pages.includes(`create --example ${name}\n`));

    assert.deepEqual(missing, [], `Add these examples to content/docs/examples: ${missing}`);
  });
});
