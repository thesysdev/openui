// Adds `type:`, `component:` and `community:` labels to issues and PRs from their title,
// body and (for PRs) changed files. Labels are only ever added, never removed,
// so manual triage sticks. Priority and status labels are left to people and
// to triage.mjs.

import { ensureLabels, LABELS, PACKAGES } from "./labels.mjs";

// Conventional commit type -> label.
const COMMIT_TYPES = {
  feat: "type: feature/enhancement",
  feature: "type: feature/enhancement",
  fix: "type: bug",
  bug: "type: bug",
  docs: "type: docs",
  doc: "type: docs",
  chore: "type: chore",
  refactor: "type: refactor",
  test: "type: tests",
  tests: "type: tests",
  perf: "type: performance",
  ci: "type: ci",
  build: "type: ci",
};

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const word = (s) => `(?<![\\w-])${s}(?![\\w-])`;
const anyOf = (terms) => new RegExp(terms.map((t) => word(escape(t))).join("|"), "i");

const EXAMPLES_PATH = /(?<![\w-])(examples|templates)\/[\w-]/i;

const COMPONENTS = [
  ...PACKAGES.map((p) => {
    const names = [p.name, ...(p.aliases || [])];
    const scoped = [`@openuidev/${p.name}`, `packages/${p.dir}`];
    return {
      label: `component: ${p.name}`,
      paths: [`packages/${p.dir}/`],
      scopes: [p.dir, ...names],
      title: anyOf([...scoped, ...(p.bare ? names : p.aliases || [])]),
      body: anyOf(scoped),
    };
  }),
  {
    label: "component: examples",
    paths: ["examples/", "templates/"],
    scopes: ["examples", "example", "templates", "template"],
    title: EXAMPLES_PATH,
    body: EXAMPLES_PATH,
  },
  { label: "component: spec", paths: ["spec/"], scopes: ["spec"] },
  { label: "component: benchmarks", paths: ["benchmarks/"], scopes: ["bench", "benchmarks"] },
  {
    label: "component: openui.com site",
    paths: ["docs/"],
    scopes: ["site", "blog", "lab", "gateway"],
  },
];

// A PR whose files all match one of these also gets the type.
const PATH_TYPES = [
  { label: "type: docs", paths: ["docs/", "README.md", "CONTRIBUTING.md", "ADOPTERS.md"] },
  { label: "type: ci", paths: [".github/", "scripts/"] },
];

// Labels for people sharing what they built with OpenUI or asking to work with us.
const COMMUNITY = [
  {
    label: "community: lab project",
    paths: ["docs/lib/lab-projects.ts"],
    scopes: ["lab"],
    prefixes: ["project"],
    title:
      /\b(add|submit|list|feature)\b.*\b(to|in|on) (the )?(openui )?(lab|projects|showcase)\b/i,
  },
  {
    label: "community: adopters",
    paths: ["ADOPTERS.md"],
    scopes: ["adopters"],
    prefixes: ["adopter", "adopters"],
    title: /\badopters?\b/i,
    body: /\bADOPTERS\.md\b/,
  },
  {
    label: "community: collab request",
    paths: [],
    scopes: [],
    prefixes: ["collab"],
    title:
      /\b(collab\w*|partner(ship)?s?|rev ?share|sponsor\w*|co-?marketing|integration (inquiry|request|proposal))\b/i,
  },
];

// Other files a project submission PR may touch: the other community lists and images.
const isSubmissionFile = (f) =>
  COMMUNITY.some((c) => matchesPath(f, c.paths)) || /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(f);

// An issue body naming more packages than this says nothing about which one
// the issue is about, so its package mentions are ignored.
const MAX_BODY_COMPONENTS = 2;

// "fix(lang-core, react-lang)!: ..." or "[BUG]: ..."
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
  if (/^\s*(add|support|introduce|allow|expose)\b/i.test(title)) return "type: feature/enhancement";
  return null;
}

function typeFromIssueBody(body) {
  if (/^#*\s*\**Describe the bug/im.test(body)) return "type: bug";
  if (/^#*\s*\**Is your feature request related to a problem/im.test(body)) {
    return "type: feature/enhancement";
  }
  return null;
}

const matchesPath = (file, paths) =>
  paths.some((p) => (p.endsWith("/") ? file.startsWith(p) : file === p));

export function labelsFor({ title, body = "", files = [], isPr }) {
  const labels = new Set();
  const { type: prefix, scopes } = parseTitle(title);

  const type = typeFromTitle(title) || (isPr ? null : typeFromIssueBody(body));
  if (type) labels.add(type);

  if (isPr) {
    for (const c of COMPONENTS) {
      if (files.some((f) => matchesPath(f, c.paths))) labels.add(c.label);
    }
    if (files.length > 0) {
      for (const { label, paths } of PATH_TYPES) {
        if (files.every((f) => matchesPath(f, paths))) labels.add(label);
      }
    }
  } else {
    const prose = body.replace(/```[\s\S]*?(```|$)/g, "");
    for (const c of COMPONENTS) {
      if (c.title?.test(title)) labels.add(c.label);
    }
    const fromBody = COMPONENTS.filter((c) => c.body?.test(prose)).map((c) => c.label);
    if (fromBody.length <= MAX_BODY_COMPONENTS) fromBody.forEach((l) => labels.add(l));
  }

  for (const c of COMMUNITY) {
    if (scopes.some((s) => c.scopes.includes(s)) || c.prefixes.includes(prefix)) {
      labels.add(c.label);
    } else if (isPr) {
      // Only when the PR is just the submission, not a wider change that touches the file.
      const own = files.filter((f) => matchesPath(f, c.paths));
      if (own.length && files.every((f) => own.includes(f) || isSubmissionFile(f))) {
        labels.add(c.label);
      }
    } else if (c.title?.test(title) || c.body?.test(body)) {
      labels.add(c.label);
    }
  }

  for (const c of COMPONENTS) {
    if (scopes.some((s) => c.scopes.includes(s))) labels.add(c.label);
  }
  if (scopes.includes("docs")) labels.add("type: docs");
  if (scopes.includes("ci")) labels.add("type: ci");

  return labels;
}

export default async function autoLabel({ github, context, core }) {
  const { owner, repo } = context.repo;
  const client = { github, owner, repo };

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
    const wanted = labelsFor({ title: item.title || "", body: item.body || "", files, isPr });
    const current = new Set((item.labels || []).map((l) => (typeof l === "string" ? l : l.name)));
    const toAdd = [...wanted].filter((l) => !current.has(l));
    if (toAdd.length === 0) return;
    await ensureLabels(client, toAdd);
    await github.rest.issues.addLabels({ owner, repo, issue_number: item.number, labels: toAdd });
    core.info(`#${item.number}: added ${toAdd.join(", ")}`);
  }

  if (context.eventName === "workflow_dispatch") {
    // Also creates every label, so people can apply priorities and statuses.
    await ensureLabels(client, Object.keys(LABELS));
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
}
