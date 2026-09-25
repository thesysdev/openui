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

const parseVersion = (v) => v.split("-")[0].split(".").map(Number);
const compare = (a, b) => {
  const [x, y] = [parseVersion(a), parseVersion(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return 0;
};
const satisfies = (version, range) =>
  range.split(/\s+/).every((comparator) => {
    const m = comparator.match(/^(>=|<=|>|<|=)?(\d+\.\d+\.\d+)$/);
    if (!m) throw new Error(`unsupported comparator "${comparator}" in "${range}"`);
    const c = compare(version, m[2]);
    switch (m[1] ?? "=") {
      case ">=": return c >= 0;
      case "<=": return c <= 0;
      case ">": return c > 0;
      case "<": return c < 0;
      default: return c === 0;
    }
  });

const versions = new Map();
const manifests = [];
for (const dir of readdirSync("packages")) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(`packages/${dir}/package.json`, "utf8"));
  } catch {
    continue;
  }
  versions.set(manifest.name, manifest.version);
  manifests.push(manifest);
}

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
