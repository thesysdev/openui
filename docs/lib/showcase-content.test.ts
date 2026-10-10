import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { EXAMPLE_CATEGORIES } from "./example-categories";

const integrationsPage = readFileSync(
  join(import.meta.dirname, "../content/docs/integrations/index.mdx"),
  "utf8",
);

describe("integrations page", () => {
  // Section headings live in the MDX so they show in the TOC; ExampleCategory renders the cards.
  it("has a heading and cards for every example category", () => {
    for (const category of EXAMPLE_CATEGORIES) {
      assert.ok(
        integrationsPage.includes(
          `## ${category.title}\n\n<ExampleCategory id="${category.id}" />`,
        ),
        `Missing section for ${category.id}`,
      );
    }
  });
});
