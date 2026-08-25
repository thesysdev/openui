// Informational changeset analysis for PRs. Never fails the build: it prints
// warnings to the console and, in CI, to the job summary, then exits 0.
//
// Usage: node scripts/changeset-check.mjs [base-ref]   (default: origin/main)
//
// Checks:
//   1. Files under packages/ changed but the PR adds no changeset.
//   2. A changeset declares a breaking bump (minor/major on a 0.x package,
//      major on >=1.0.0), which escapes consumers' ^ ranges — lists the fixed
//      group members and runtime dependents that will be released with it.
//   3. Peer-floor rule: a breaking bump targets a package that others declare
//      as an internal peerDependency, and those dependents' package.json files
//      are untouched in this PR — their bounded peer windows may need moving.
import { execFileSync } from "node:child_process";
import { appendFileSync, readdirSync, readFileSync } from "node:fs";

const baseRef = process.argv[2] ?? "origin/main";
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

const mergeBase = git("merge-base", baseRef, "HEAD");
const changedFiles = git("diff", "--name-only", mergeBase, "HEAD")
  .split("\n")
  .filter(Boolean);

// --- workspace model -------------------------------------------------------
const packages = new Map(); // name -> {dir, version, dependencies, peerDependencies}
for (const dir of readdirSync("packages")) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(`packages/${dir}/package.json`, "utf8"));
  } catch {
    continue;
  }
  packages.set(manifest.name, {
    dir,
    version: manifest.version,
    dependencies: manifest.dependencies ?? {},
    peerDependencies: manifest.peerDependencies ?? {},
  });
}

const config = JSON.parse(readFileSync(".changeset/config.json", "utf8"));
const fixedGroups = config.fixed ?? [];
const groupOf = (name) => fixedGroups.find((g) => g.includes(name)) ?? [name];

// name -> direct runtime dependents (workspace-internal only)
const dependentsOf = new Map();
for (const [name, pkg] of packages) {
  for (const dep of Object.keys(pkg.dependencies)) {
    if (!packages.has(dep)) continue;
    if (!dependentsOf.has(dep)) dependentsOf.set(dep, []);
    dependentsOf.get(dep).push(name);
  }
}
const transitiveDependents = (name) => {
  const seen = new Set();
  const queue = [name];
  while (queue.length) {
    for (const dep of dependentsOf.get(queue.pop()) ?? []) {
      if (!seen.has(dep)) {
        seen.add(dep);
        queue.push(dep);
      }
    }
  }
  return [...seen];
};

// --- changesets in this PR -------------------------------------------------
const changesetFiles = changedFiles.filter(
  (f) => /^\.changeset\/[^/]+\.md$/.test(f) && !f.endsWith("README.md"),
);
const declaredBumps = new Map(); // package name -> patch|minor|major
for (const file of changesetFiles) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue; // deleted by this PR (e.g. consumed by a version PR)
  }
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) continue;
  for (const line of frontmatter[1].split("\n")) {
    const entry = line.match(/^"?([^"\s:]+)"?\s*:\s*(patch|minor|major)\s*$/);
    if (!entry) continue;
    const [, name, level] = entry;
    const rank = { patch: 0, minor: 1, major: 2 };
    const prev = declaredBumps.get(name);
    if (!prev || rank[level] > rank[prev]) declaredBumps.set(name, level);
  }
}

const isBreaking = (name, level) => {
  const version = packages.get(name)?.version ?? "0.0.0";
  return version.startsWith("0.") ? level !== "patch" : level === "major";
};

// --- checks ----------------------------------------------------------------
const warnings = [];

// 1. package changes without a changeset
const touchedPackageDirs = new Set(
  changedFiles
    .map((f) => f.match(/^packages\/([^/]+)\//)?.[1])
    .filter(Boolean),
);
if (touchedPackageDirs.size > 0 && changesetFiles.length === 0) {
  warnings.push(
    `Files changed in \`packages/{${[...touchedPackageDirs].join(", ")}}\` but no changeset was added. ` +
      "If this PR changes published behavior, run `pnpm changeset`. Docs/CI-only changes can ignore this.",
  );
}

// Effective breaking set: a breaking bump on any fixed-group member bumps the
// whole group to the same level.
const breakingSet = new Set();
for (const [name, level] of declaredBumps) {
  if (!isBreaking(name, level)) continue;
  for (const member of groupOf(name)) breakingSet.add(member);
}

// 2. range-breaking bumps + cascade impact
for (const [name, level] of declaredBumps) {
  if (!isBreaking(name, level)) continue;
  const group = groupOf(name).filter((m) => m !== name);
  const cascade = transitiveDependents(name).filter((d) => !group.includes(d));
  const parts = [];
  if (group.length) parts.push(`co-releases its fixed group (${group.join(", ")})`);
  if (cascade.length) parts.push(`cascade-releases runtime dependents (${cascade.join(", ")})`);
  warnings.push(
    `\`${name}\` declares **${level}** — breaking for a ${packages.get(name)?.version} package ` +
      `(escapes consumers' \`^\` ranges)${parts.length ? ". It " + parts.join(" and ") : ""}.`,
  );
}

// 3. peer-floor rule
for (const target of breakingSet) {
  for (const [name, pkg] of packages) {
    const range = pkg.peerDependencies[target];
    if (!range || range.startsWith("workspace:")) continue;
    const manifestPath = `packages/${pkg.dir}/package.json`;
    if (changedFiles.includes(manifestPath)) continue;
    warnings.push(
      `\`${target}\` gets a breaking bump, and \`${name}\` peer-depends on it (\`${range}\`) ` +
        `but ${manifestPath} is untouched in this PR. Confirm compatibility or move the peer window in this PR.`,
    );
  }
}

// --- report ----------------------------------------------------------------
const lines =
  warnings.length === 0
    ? ["### Changeset check", "", "No warnings."]
    : ["### Changeset check", "", ...warnings.map((w) => `- ⚠️ ${w}`)];
console.log(lines.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
}
process.exit(0);
