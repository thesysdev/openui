// Publish-time guard for the hand-maintained internal peer windows.
//
// Internal @openuidev/* peerDependencies use bounded ranges (e.g.
// ">=0.3.0 <0.4.0") that changesets never rewrites. This asserts, right before
// `changeset publish`, that every such window contains the workspace sibling's
// current (about-to-be-published or already-published) version — turning a
// stale window into a loud publish failure instead of a broken install for
// consumers. Runs via `pnpm run release:publish`; exits nonzero on violation.
//
// Note: on a pre-first-train working tree the windows are intentionally ahead
// of the manifests, so this is wired into the publish path only — do not add
// it to PR CI.
import { readdirSync, readFileSync } from "node:fs";

// Semver order, prerelease included: 1.0.0-beta.0 < 1.0.0-beta.1 < 1.0.0. The
// beta kits pin each other exactly, so a stale prerelease must not compare equal.
const parseVersion = (v) => {
  const [release, pre] = v.split(/-(.*)/s);
  return { release: release.split(".").map(Number), pre: pre ? pre.split(".") : [] };
};
const compareIdentifiers = (a, b) => {
  const [an, bn] = [/^\d+$/.test(a), /^\d+$/.test(b)];
  if (an && bn) return Math.sign(Number(a) - Number(b));
  if (an !== bn) return an ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
};
const compare = (a, b) => {
  const [x, y] = [parseVersion(a), parseVersion(b)];
  for (let i = 0; i < 3; i++)
    if (x.release[i] !== y.release[i]) return x.release[i] < y.release[i] ? -1 : 1;
  if (!x.pre.length || !y.pre.length) return Math.sign(y.pre.length - x.pre.length);
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
    if (x.pre[i] === undefined) return -1;
    if (y.pre[i] === undefined) return 1;
    const c = compareIdentifiers(x.pre[i], y.pre[i]);
    if (c) return c;
  }
  return 0;
};
const satisfies = (version, range) =>
  range.split(/\s+/).every((comparator) => {
    // Allow a prerelease suffix (e.g. "0.0.0-beta.0"): the beta kits pin each
    // other exactly, and without this the comparator throws at publish time.
    const m = comparator.match(/^(>=|<=|>|<|=)?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/);
    if (!m) throw new Error(`unsupported comparator "${comparator}" in "${range}"`);
    const c = compare(version, m[2]);
    switch (m[1] ?? "=") {
      case ">=":
        return c >= 0;
      case "<=":
        return c <= 0;
      case ">":
        return c > 0;
      case "<":
        return c < 0;
      default:
        return c === 0;
    }
  });

const versions = new Map();
const manifests = [];

// `packages/*` AND `packages/*/*`: the kits live at packages/kits/<name>, and a
// one-level scan silently skipped them — the try/catch swallowed the missing
// packages/kits/package.json, so their peer windows were never checked at all.
// pnpm-workspace.yaml already lists "packages/kits/*"; this keeps the guard in
// step with it.
const collect = (dir, depth) => {
  try {
    const manifest = JSON.parse(readFileSync(`${dir}/package.json`, "utf8"));
    versions.set(manifest.name, manifest.version);
    manifests.push(manifest);
    return;
  } catch {
    // No manifest here — recurse into it as a grouping directory.
  }
  if (depth === 0) return;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) collect(`${dir}/${entry}`, depth - 1);
};
for (const dir of readdirSync("packages")) collect(`packages/${dir}`, 1);

const violations = [];
for (const manifest of manifests) {
  for (const [peer, range] of Object.entries(manifest.peerDependencies ?? {})) {
    if (!versions.has(peer) || range.startsWith("workspace:")) continue;
    if (!satisfies(versions.get(peer), range)) {
      violations.push(
        `${manifest.name} peer-requires ${peer} "${range}", but the workspace ` +
          `version is ${versions.get(peer)} — move the peer window before releasing.`,
      );
    }
  }
}

if (violations.length) {
  console.error("Internal peer windows do not match the versions being published:\n");
  for (const v of violations) console.error(`  ✗ ${v}`);
  process.exit(1);
}
console.log("verify-peer-windows: all internal peer windows contain the workspace versions.");
