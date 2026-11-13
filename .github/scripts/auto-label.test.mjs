import assert from "node:assert/strict";
import { test } from "node:test";
import { labelsFor } from "./auto-label.mjs";

const labels = (input) => [...labelsFor(input)].sort();

test("PR type and components come from the title and changed files", () => {
  assert.deepEqual(
    labels({
      title: "fix(devtools): settle stream rows",
      files: ["packages/devtools/src/a.ts", "packages/react-lang/src/b.ts"],
      isPr: true,
    }),
    ["component: devtools", "component: react-lang", "type: bug"],
  );
});

test("docs-only PR gets type: docs and the site component", () => {
  assert.deepEqual(
    labels({ title: "Update the blog", files: ["docs/content/blog/a.mdx"], isPr: true }),
    ["component: openui.com site", "type: docs"],
  );
});

test("issue template prefixes set the type", () => {
  assert.deepEqual(labels({ title: "[BUG]: crash", isPr: false }), ["type: bug"]);
  assert.deepEqual(labels({ title: "[FEATURE]: thing", isPr: false }), [
    "type: feature/enhancement",
  ]);
  assert.deepEqual(labels({ title: "[DOCS]: typo", isPr: false }), ["type: docs"]);
});

test("issue components come from the title and scoped names in the body", () => {
  assert.deepEqual(
    labels({
      title: "react-headless: adapters drop reasoning",
      body: "Using @openuidev/react-ui.\n```\nimport x from '@openuidev/lang-core'\n```",
      isPr: false,
    }),
    ["component: react-headless", "component: react-ui"],
  );
});

test("a body that names many packages is ignored", () => {
  const body = "@openuidev/react-lang @openuidev/vue-lang @openuidev/svelte-lang";
  assert.deepEqual(labels({ title: "Mutations are lost on reload", body, isPr: false }), []);
});

test("project submissions get the lab label", () => {
  assert.deepEqual(labels({ title: "Add Curio to OpenUI Lab", isPr: false }), [
    "community: lab project",
    "type: feature/enhancement",
  ]);
  assert.deepEqual(labels({ title: "[PROJECT]: Curio", isPr: false }), ["community: lab project"]);
  assert.deepEqual(
    labels({
      title: "docs(lab): add Learnify to community projects",
      files: ["docs/lib/lab-projects.ts", "ADOPTERS.md"],
      isPr: true,
    }),
    ["community: adopters", "community: lab project", "component: openui.com site", "type: docs"],
  );
  assert.deepEqual(
    labels({ title: "Add a curated Projects directory to the website", isPr: false }),
    ["type: feature/enhancement"],
  );
});

test("ADOPTERS.md changes get the adopters label", () => {
  assert.deepEqual(
    labels({ title: "docs: add Automatio AI", files: ["ADOPTERS.md"], isPr: true }),
    ["community: adopters", "type: docs"],
  );
  assert.deepEqual(labels({ title: "Update ADOPTERS.md", isPr: false }), ["community: adopters"]);
});

test("partnership and integration requests get the collab label", () => {
  assert.deepEqual(
    labels({ title: "50/50 RevShare Integration: OpenUI & AIML API", isPr: false }),
    ["community: collab request"],
  );
  assert.deepEqual(labels({ title: "Integration inquiry: AntD/X project", isPr: false }), [
    "community: collab request",
  ]);
  assert.deepEqual(labels({ title: "[COLLAB]: Acme", isPr: false }), ["community: collab request"]);
});

test("wider PRs that only touch a community file don't get the community label", () => {
  const files = ["ADOPTERS.md", "docs/lib/lab-projects.ts", "examples/a/README.md"];
  assert.deepEqual(labels({ title: "Switch examples to OpenUI Cloud", files, isPr: true }), [
    "component: examples",
    "component: openui.com site",
  ]);
});
