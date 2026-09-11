// Informational changeset analysis for PRs. Never fails the build: it prints
// warnings to the console and, in CI, to the job summary, then exits 0 — even
// on internal errors.
//
// Usage: node scripts/changeset-check.mjs [base-ref]   (default: origin/main)
//
// Checks:
//   1. Packages changed in this PR that no changeset (directly, via fixed
//      group, or via runtime-dependency cascade) would release.
//   2. A changeset declares a breaking bump — one that escapes consumers' ^
//      ranges: any bump on 0.0.x, minor+ on 0.x, major on >=1.0.0 — listing
//      the fixed-group members and cascaded dependents released with it.
//   3. Peer-floor rule: a breaking bump targets a package that others declare
//      as an internal peerDependency, and those dependents' package.json files
//      are untouched in this PR — their bounded peer windows may need moving.
//
// This intentionally approximates `changeset version` (fixed groups, cascades
// through workspace:-protocol runtime dependencies). If config options beyond
// `fixed` start being used (ignore lists, linked groups), revisit whether to
// swap the model for @changesets/assemble-release-plan.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";

const report = (lines) => {
  console.log(lines.join("\n"));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
  }
};

const main = () => {
  const baseRef = process.argv[2] ?? "origin/main";
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

  const mergeBase = git("merge-base", baseRef, "HEAD");
  const changedFiles = git("diff", "--name-only", mergeBase, "HEAD")
    .split("\n")
    .filter(Boolean);

  // --- workspace model -----------------------------------------------------
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
  const packageByDir = new Map([...packages].map(([name, p]) => [p.dir, name]));

  const config = JSON.parse(readFileSync(".changeset/config.json", "utf8"));
  const fixedGroups = config.fixed ?? [];
  const groupOf = (name) => fixedGroups.find((g) => g.includes(name)) ?? [name];

  // name -> direct runtime dependents. Only workspace:-protocol ranges cascade
  // (bumpVersionsWithWorkspaceProtocolOnly); bounded ranges are hand-managed.
  const dependentsOf = new Map();
  for (const [name, pkg] of packages) {
    for (const [dep, range] of Object.entries(pkg.dependencies)) {
      if (!packages.has(dep) || !range.startsWith("workspace:")) continue;
      if (!dependentsOf.has(dep)) dependentsOf.set(dep, []);
      dependentsOf.get(dep).push(name);
    }
  }

  // Everything released when `seeds` release: cascade through runtime
  // dependents and expand fixed groups, to a fixpoint.
  const releaseClosure = (seeds) => {
    const seen = new Set(seeds);
    const queue = [...seen];
    while (queue.length) {
      const name = queue.pop();
      for (const next of [...groupOf(name), ...(dependentsOf.get(name) ?? [])]) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    return seen;
  };

  // --- changesets in this PR (added or modified; deletions don't count) ----
  const changesetFiles = changedFiles.filter(
    (f) => /^\.changeset\/[^/]+\.md$/.test(f) && !f.endsWith("README.md") && existsSync(f),
  );
  const declaredBumps = new Map(); // package name -> patch|minor|major
  const unknownNames = new Set();
  const rank = { patch: 0, minor: 1, major: 2 };
  for (const file of changesetFiles) {
    const text = readFileSync(file, "utf8");
    const frontmatter = text.match(/^\s*---\r?\n([\s\S]*?)\r?\n\s*---/);
    if (!frontmatter) continue;
    for (const rawLine of frontmatter[1].split("\n")) {
      const entry = rawLine
        .trim()
        .match(/^['"]?([^'"\s:]+)['"]?\s*:\s*(patch|minor|major)$/);
      if (!entry) continue;
      const [, name, level] = entry;
      if (!packages.has(name)) {
        unknownNames.add(`${name} (${file})`);
        continue;
      }
      const prev = declaredBumps.get(name);
      if (!prev || rank[level] > rank[prev]) declaredBumps.set(name, level);
    }
  }

  const isBreaking = (name, level) => {
    const version = packages.get(name).version;
    // ^0.0.x admits exactly one version: every bump escapes.
    if (version.startsWith("0.0.")) return true;
    if (version.startsWith("0.")) return level !== "patch";
    return level === "major";
  };

  // --- checks --------------------------------------------------------------
  const warnings = [];

  for (const entry of unknownNames) {
    warnings.push(
      `Changeset names \`${entry}\`, which is not a workspace package — \`changeset version\` will fail on it. Typo?`,
    );
  }

  // 1. touched packages that nothing would release
  const releaseSet = releaseClosure(declaredBumps.keys());
  const touchedNames = [
    ...new Set(
      changedFiles
        .map((f) => packageByDir.get(f.match(/^packages\/([^/]+)\//)?.[1]))
        .filter(Boolean),
    ),
  ];
  const uncovered = touchedNames.filter((name) => !releaseSet.has(name));
  if (uncovered.length > 0) {
    warnings.push(
      `Changed but not released by any changeset in this PR: ${uncovered.map((n) => `\`${n}\``).join(", ")}. ` +
        "If this PR changes their published behavior, run `pnpm changeset`. Docs/CI-only changes can ignore this.",
    );
  }

  // 2. range-breaking bumps + impact; collect the effective breaking set for 3.
  const breakingSet = new Set();
  for (const [name, level] of declaredBumps) {
    if (!isBreaking(name, level)) continue;
    for (const member of groupOf(name)) breakingSet.add(member);
    const group = groupOf(name).filter((m) => m !== name);
    const cascade = [...releaseClosure([name])].filter(
      (d) => d !== name && !group.includes(d),
    );
    const parts = [];
    if (group.length) parts.push(`co-releases its fixed group (${group.join(", ")})`);
    if (cascade.length) parts.push(`cascade-releases dependents (${cascade.join(", ")})`);
    warnings.push(
      `\`${name}\` declares **${level}** — breaking for a ${packages.get(name).version} package ` +
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

  report(
    warnings.length === 0
      ? ["### Changeset check", "", "No warnings."]
      : ["### Changeset check", "", ...warnings.map((w) => `- ⚠️ ${w}`)],
  );
};

try {
  main();
} catch (error) {
  // Informational check: internal errors must not block the PR.
  report([
    "### Changeset check",
    "",
    `- ⚠️ changeset-check could not run: ${error?.message ?? error}`,
  ]);
}
process.exit(0);
