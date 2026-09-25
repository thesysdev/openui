import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { EXAMPLE_CATEGORIES } from "./example-categories";

const contentRoot = join(import.meta.dirname, "../content/docs");

function sidebarLinks(folder: string): string[] {
  const meta = JSON.parse(readFileSync(join(contentRoot, folder, "meta.json"), "utf8")) as {
    pages: string[];
  };
  return meta.pages.flatMap((entry) => entry.match(/\((?<url>[^)]+)\)$/)?.groups?.url ?? []);
}

describe("showcase sidebars", () => {
  // The Examples sidebar links to sections that RepoExamples renders from EXAMPLE_CATEGORIES.
  it("links to every example category", () => {
    const links = sidebarLinks("examples");
    for (const category of EXAMPLE_CATEGORIES) {
      assert.ok(
        links.includes(`/examples#${category.id}`),
        `Missing sidebar link for ${category.id}`,
      );
    }
  });
});
