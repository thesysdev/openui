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
