// Every label the automations in this folder add, with its color and
// description. A label is created on first use if the repo doesn't have it.

const TYPE = "c2e0c6";
const COMPONENT = "1d76db";
const PRIORITY = "d40aea";

export const PACKAGES = [
  // dir: folder under packages/. name: npm name without @openuidev/.
  // bare: the unscoped name is distinctive enough to match in issue titles.
  { dir: "a2ui", name: "a2ui", bare: true },
  { dir: "angular-lang", name: "angular-lang", bare: true },
  { dir: "assistant-ui", name: "assistant-ui", bare: false },
  { dir: "browser-bundle", name: "browser-bundle", bare: true },
  { dir: "devtools", name: "devtools", bare: true },
  { dir: "lang-core", name: "lang-core", bare: true },
  { dir: "langchain", name: "langchain", bare: false },
  { dir: "observability", name: "observability", bare: false },
  { dir: "observability-cloud", name: "observability-cloud", bare: true },
  { dir: "openui-cli", name: "cli", bare: false, aliases: ["openui-cli"] },
  { dir: "react-components", name: "react-components", bare: true },
  { dir: "react-email", name: "react-email", bare: true },
  { dir: "react-headless", name: "react-headless", bare: true },
  { dir: "react-lang", name: "react-lang", bare: true },
  { dir: "react-ui", name: "react-ui", bare: true },
  { dir: "server", name: "server", bare: false },
  { dir: "svelte-lang", name: "svelte-lang", bare: true },
  { dir: "vue-lang", name: "vue-lang", bare: true },
  { dir: "libraries/dashboard", name: "dashboard-library", bare: true, aliases: ["dashboard-kit"] },
];

export const LABELS = {
  "type: bug": { color: "a15765", description: "Something isn't working" },
  "type: feature/enhancement": { color: TYPE, description: "New feature or request" },
  "type: docs": { color: "0075ca", description: "Documentation" },
  "type: chore": { color: "ededed", description: "Maintenance, releases and tooling" },
  "type: refactor": { color: "c5def5", description: "Neither fixes a bug nor adds a feature" },
  "type: tests": { color: "bfd4f2", description: "Adds or changes tests" },
  "type: performance": { color: "fbca04", description: "Performance improvement" },
  "type: ci": { color: "fabada", description: "CI, workflows and repo scripts" },

  ...Object.fromEntries(
    PACKAGES.map((p) => [
      `component: ${p.name}`,
      { color: COMPONENT, description: `@openuidev/${p.name} (packages/${p.dir})` },
    ]),
  ),
  "component: examples": { color: "0052cc", description: "Examples and starter templates" },
  "component: spec": { color: "10fc43", description: "OpenUI Lang specification" },
  "component: benchmarks": { color: "c2e0c6", description: "Benchmarks" },
  "component: openui.com site": { color: "0075ca", description: "The docs site under docs/" },

  P0: { color: PRIORITY, description: "Urgent. Should always have an assignee." },
  P1: { color: PRIORITY, description: "Priority. Being worked on now or soon." },
  P2: { color: PRIORITY, description: "Planned for the near future, or lower priority." },
  P3: { color: PRIORITY, description: "Good request, not currently planned." },

  "status: needs-triage": {
    color: "fc17e8",
    description: "Needs a maintainer. Managed by .github/scripts/triage.mjs",
  },
  "status: waiting-for-author-response": {
    color: "000000",
    description: "Waiting on the author. Removed when they reply.",
  },
  "status: assigned-for-triage": {
    color: "fcf2ae",
    description: "Assigned to a maintainer for triage",
  },
};

export async function ensureLabels({ github, owner, repo }, names) {
  const existing = new Set(
    (
      await github.paginate(github.rest.issues.listLabelsForRepo, { owner, repo, per_page: 100 })
    ).map((l) => l.name.toLowerCase()),
  );
  for (const name of names) {
    if (existing.has(name.toLowerCase()) || !LABELS[name]) continue;
    try {
      await github.rest.issues.createLabel({ owner, repo, name, ...LABELS[name] });
    } catch (err) {
      if (err.status !== 422) throw err; // 422: created by a concurrent run
    }
  }
}
