// Adds labels to issues and PRs from their title, body and (for PRs) changed
// files. Labels are only ever added, never removed, so manual triage sticks.
// Missing labels are created with the color and description below.

const TYPE_LABELS = {
  bug: { color: "d73a4a", description: "Something isn't working" },
  enhancement: { color: "a2eeef", description: "New feature or request" },
  documentation: { color: "0075ca", description: "Improvements or additions to documentation" },
  chore: { color: "ededed", description: "Maintenance, releases and tooling" },
  refactor: {
    color: "c5def5",
    description: "Code change that neither fixes a bug nor adds a feature",
  },
  tests: { color: "bfd4f2", description: "Adds or changes tests" },
  performance: { color: "fbca04", description: "Performance improvement" },
  ci: { color: "5319e7", description: "CI, workflows and repo scripts" },
};

// Conventional commit type -> label.
const COMMIT_TYPES = {
  feat: "enhancement",
  fix: "bug",
  bug: "bug",
  docs: "documentation",
  doc: "documentation",
  chore: "chore",
  refactor: "refactor",
  test: "tests",
  tests: "tests",
  perf: "performance",
  ci: "ci",
  build: "ci",
};

const PKG_COLOR = "1d76db";

// dir: folder under packages/, name: npm name without @openuidev/,
// bare: also match the name without the @openuidev/ scope.
const PACKAGES = [
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
  {
    dir: "libraries/dashboard",
    name: "dashboard-library",
    bare: true,
    aliases: ["dashboard-kit"],
  },
];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const word = (s) => `(?<![\\w-])${s}(?![\\w-])`;

const AREA_LABELS = [
  ...PACKAGES.map((p) => {
    const names = [p.name, ...(p.aliases || [])];
    const scoped = [`@openuidev/${p.name}`, `packages/${p.dir}`];
    const titleTerms = [...scoped, ...(p.bare ? names : p.aliases || [])];
    const toRegex = (terms) => new RegExp(terms.map((t) => word(escape(t))).join("|"), "i");
    return {
      name: `pkg: ${p.name}`,
      color: PKG_COLOR,
      description: `@openuidev/${p.name} (packages/${p.dir})`,
      paths: [`packages/${p.dir}/`],
      scopes: [p.dir, ...names],
      title: toRegex(titleTerms),
      body: toRegex(scoped),
    };
  }),
  {
    name: "examples",
    color: "0e8a16",
    description: "Examples and starter templates",
    paths: ["examples/", "templates/"],
    scopes: ["examples", "example", "templates", "template"],
    title: /(?<![\w-])(examples|templates)\/[\w-]/i,
    body: /(?<![\w-])(examples|templates)\/[\w-]/i,
  },
  {
    name: "spec",
    color: "b60205",
    description: "OpenUI Lang specification and conformance suite",
    paths: ["spec/"],
    scopes: ["spec"],
  },
  {
    name: "benchmarks",
    color: "c2e0c6",
    description: "Benchmarks",
    paths: ["benchmarks/"],
    scopes: ["bench", "benchmarks"],
  },
];

// Changed paths that imply a type label.
const PATH_TYPES = [
  { label: "documentation", paths: ["docs/", "README.md", "CONTRIBUTING.md", "ADOPTERS.md"] },
  { label: "ci", paths: [".github/", "scripts/"] },
];

const MAX_BODY_AREAS = 2;

const MAINTAINERS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);
const COMMUNITY = {
  name: "community",
  color: "f9d0c4",
  description: "Opened by an external contributor",
};

const ALL_LABELS = new Map([
  ...Object.entries(TYPE_LABELS).map(([name, l]) => [name, { name, ...l }]),
  ...AREA_LABELS.map((l) => [l.name, l]),
  [COMMUNITY.name, COMMUNITY],
]);

// "fix(lang-core, react-lang)!: ..." -> { type: "fix", scopes: [...] }
function parseTitle(title) {
  const m = /^\s*\[?([a-z]+)\]?(?:\(([^)]*)\))?!?\s*:/i.exec(title);
  if (!m) return { type: null, scopes: [] };
  const scopes = (m[2] || "")
    .split(/[,/\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return { type: m[1].toLowerCase(), scopes };
}

function typeFromTitle(title) {
  const { type } = parseTitle(title);
  if (type && COMMIT_TYPES[type]) return COMMIT_TYPES[type];
  if (/^\s*\[?(bug|fix)\]?\b/i.test(title)) return "bug";
  if (/^\s*\[?(feature|feat|feature request)\]?\b/i.test(title)) return "enhancement";
  if (/^\s*(add|support|introduce|allow|expose)\b/i.test(title)) return "enhancement";
  return null;
}

function typeFromIssueTemplate(body) {
  if (/\*\*Describe the bug\*\*/.test(body)) return "bug";
  if (/\*\*Is your feature request related to a problem/.test(body)) return "enhancement";
  return null;
}

const matchesPath = (file, paths) =>
  paths.some((p) => (p.endsWith("/") ? file.startsWith(p) : file === p));

function labelsFor({ title, body, files, isPr, association }) {
  const labels = new Set();
  const { scopes } = parseTitle(title);

  const type = typeFromTitle(title) || (isPr ? null : typeFromIssueTemplate(body));
  if (type) labels.add(type);

  if (isPr) {
    // PRs get area labels from the files they touch.
    for (const area of AREA_LABELS) {
      if (files.some((f) => matchesPath(f, area.paths))) labels.add(area.name);
    }
  } else {
    // Issues: names anywhere in the title, scoped names (@openuidev/x) in the
    // body outside code blocks. A body that names many packages is ignored as
    // too generic to say which one the issue is about.
    const prose = body.replace(/```[\s\S]*?(```|$)/g, "");
    const fromBody = AREA_LABELS.filter((a) => a.body?.test(prose)).map((a) => a.name);
    for (const area of AREA_LABELS) {
      if (area.title?.test(title)) labels.add(area.name);
    }
    if (fromBody.length <= MAX_BODY_AREAS) fromBody.forEach((l) => labels.add(l));
  }
  for (const area of AREA_LABELS) {
    if (scopes.some((s) => area.scopes.includes(s))) labels.add(area.name);
  }
  for (const s of scopes) {
    if (s === "docs" || s === "doc") labels.add("documentation");
    if (s === "ci") labels.add("ci");
  }

  if (isPr && files.length > 0) {
    for (const { label, paths } of PATH_TYPES) {
      if (files.every((f) => matchesPath(f, paths))) labels.add(label);
    }
  }

  if (association && !MAINTAINERS.has(association)) labels.add(COMMUNITY.name);
  return labels;
}

module.exports = async ({ github, context, core }) => {
  const { owner, repo } = context.repo;

  const existing = new Set(
    (
      await github.paginate(github.rest.issues.listLabelsForRepo, { owner, repo, per_page: 100 })
    ).map((l) => l.name.toLowerCase()),
  );

  async function ensureLabel(name) {
    if (existing.has(name.toLowerCase())) return;
    const { color, description } = ALL_LABELS.get(name);
    try {
      await github.rest.issues.createLabel({ owner, repo, name, color, description });
    } catch (err) {
      if (err.status !== 422) throw err; // 422: created concurrently
    }
    existing.add(name.toLowerCase());
  }

  async function labelItem(item) {
    const isPr = Boolean(item.pull_request) || context.eventName === "pull_request_target";
    const files = isPr
      ? (
          await github.paginate(github.rest.pulls.listFiles, {
            owner,
            repo,
            pull_number: item.number,
            per_page: 100,
          })
        ).map((f) => f.filename)
      : [];
    const wanted = labelsFor({
      title: item.title || "",
      body: item.body || "",
      files,
      isPr,
      association: item.author_association,
    });
    const current = new Set(
      (item.labels || []).map((l) => (typeof l === "string" ? l : l.name).toLowerCase()),
    );
    const toAdd = [...wanted].filter((l) => !current.has(l.toLowerCase()));
    if (toAdd.length === 0) {
      core.info(`#${item.number}: nothing to add`);
      return;
    }
    for (const name of toAdd) await ensureLabel(name);
    await github.rest.issues.addLabels({ owner, repo, issue_number: item.number, labels: toAdd });
    core.info(`#${item.number}: added ${toAdd.join(", ")}`);
  }

  if (context.eventName === "workflow_dispatch") {
    const items = await github.paginate(github.rest.issues.listForRepo, {
      owner,
      repo,
      state: "open",
      per_page: 100,
    });
    for (const item of items) await labelItem(item);
    return;
  }

  const item = context.payload.pull_request || context.payload.issue;
  if (item) await labelItem(item);
};

module.exports.labelsFor = labelsFor;
