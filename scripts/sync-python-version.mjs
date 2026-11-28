// The Python SDKs ship with their npm twin's version: py/server (openui-server on PyPI) is
// @openuidev/server in Python, and they release together. `changeset version` bumps the npm
// package; this copies that version to the Python package's pyproject.toml and uv.lock.
//
// Usage: node scripts/sync-python-version.mjs [--check]
//   --check  changes nothing; exits 1 when a Python package's version differs from its twin's.
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const TWINS = [{ npm: "packages/server", python: "py/server" }];

// npm prereleases as PEP 440: 1.2.0-beta.1 → 1.2.0b1.
function pep440(version) {
  const match = version.match(/^(\d+\.\d+\.\d+)(?:-(alpha|beta|rc)\.(\d+))?$/);
  if (!match) throw new Error(`Can't express ${version} as a Python version`);
  const [, release, pre, number] = match;
  return pre ? `${release}${{ alpha: "a", beta: "b", rc: "rc" }[pre]}${number}` : release;
}

const read = (path) => readFileSync(new URL(path, root), "utf8");
const check = process.argv.includes("--check");
let mismatched = false;

for (const twin of TWINS) {
  const { name: npmName, version } = JSON.parse(read(`${twin.npm}/package.json`));
  const expected = pep440(version);
  const pyproject = `${twin.python}/pyproject.toml`;
  const lock = `${twin.python}/uv.lock`;
  const pyName = read(pyproject).match(/^name = "([^"]+)"$/m)?.[1];
  const files = [
    // The first `version =` is [project]'s: it comes right after `name`.
    [pyproject, /^(version = ")([^"]+)(")/m],
    // uv.lock records the project's own version too.
    [lock, new RegExp(`(\\[\\[package\\]\\]\\nname = "${pyName}"\\nversion = ")([^"]+)(")`)],
  ];
  for (const [path, pattern] of files) {
    const text = read(path);
    const current = text.match(pattern)?.[2];
    if (current === undefined) throw new Error(`No version found in ${path}`);
    if (current === expected) continue;
    if (check) {
      console.error(
        `${path} is ${current}, but ${npmName} is ${version}: they release together. ` +
          "Bump versions with a changeset for the npm package, then `pnpm run version:ci`.",
      );
      mismatched = true;
    } else {
      writeFileSync(new URL(path, root), text.replace(pattern, `$1${expected}$3`));
      console.log(`${path}: ${current} → ${expected}`);
    }
  }
}
process.exit(mismatched ? 1 : 0);
