// Pre-publish guard for the CSS artifact contract:
//   - default exports stay UNLAYERED (./components.css, ./styles/*)
//   - the layered mirror is wrapped in @layer openui and BOM-free
//   - openui-defaults.css is unlayered in both trees (runtime theming contract)
// Born out of the 2026-06 BOM incident: a U+FEFF pushed inside the layer
// block silently killed the :root theme tokens in the packed tarball.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { UNLAYERED_DEFAULTS } from "./css-layer-utils.mjs";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(dirname, "dist");
const failures = [];

const read = (rel) => fs.readFileSync(path.join(dist, rel), "utf8");
const assert = (cond, msg) => {
  if (!cond) failures.push(msg);
};

assert(
  !/^\s*@layer/.test(read("components/index.css")),
  "components/index.css must stay unlayered",
);
assert(!/^\s*@layer/.test(read("styles/index.css")), "styles/index.css must stay unlayered");
assert(
  read("layered/components/index.css").startsWith("@layer openui{"),
  "layered/components/index.css must start with @layer openui{",
);
assert(
  !/^\s*@layer/.test(read("styles/openui-defaults.css")),
  "styles/openui-defaults.css must stay unlayered",
);
assert(
  !/^\s*@layer/.test(read("layered/styles/openui-defaults.css")),
  "layered/styles/openui-defaults.css must stay unlayered",
);

// Scheme-pinned defaults: unlayered in both trees, and a plain :root block with
// NO prefers-color-scheme guard (that is their whole purpose).
for (const name of UNLAYERED_DEFAULTS.filter((n) => n !== "openui-defaults.css")) {
  for (const rel of [path.join("styles", name), path.join("layered", "styles", name)]) {
    assert(!/^\s*@layer/.test(read(rel)), `${rel} must stay unlayered`);
    assert(!read(rel).includes("prefers-color-scheme"), `${rel} must not use prefers-color-scheme`);
    assert(read(rel).includes(":root"), `${rel} must define a :root block`);
  }
}

const unlayered = fs.readdirSync(path.join(dist, "styles")).filter((f) => f.endsWith(".css"));
const layered = fs
  .readdirSync(path.join(dist, "layered", "styles"))
  .filter((f) => f.endsWith(".css"));
assert(
  unlayered.length === layered.length,
  `layered mirror has ${layered.length} css files, unlayered has ${unlayered.length}`,
);

// Every per-component DEFAULT style must stay unlayered too — not just the
// index files checked above. Guards against a regression that re-wraps
// dist/styles/*.css in place (the `wrapComponentCssInPlace` behavior this
// contract intentionally removed); since consumers can import individual
// ./styles/<component>.css, an index-only check would miss it.
// openui-defaults.css is asserted unlayered separately above.
for (const name of unlayered) {
  if (UNLAYERED_DEFAULTS.includes(name)) continue;
  assert(!/^\s*@layer/.test(read(path.join("styles", name))), `styles/${name} must stay unlayered`);
}

// Unlayered default exports must also be BOM-free. A leading BOM is harmless in
// an unlayered file (the decoder drops it at byte 0), but cp-css.js strips it,
// and a regression re-arms the 2026-06 incident the moment these files are ever
// wrapped. Covers ./components.css and every ./styles/* (incl. openui-defaults).
for (const rel of ["components/index.css", ...unlayered.map((n) => path.join("styles", n))]) {
  assert(!read(rel).includes("﻿"), `${rel} contains a BOM (unlayered export must be BOM-free)`);
}

for (const f of [
  ...layered.map((n) => path.join("layered", "styles", n)),
  "layered/components/index.css",
]) {
  const content = read(f);
  assert(!content.includes("\uFEFF"), `${f} contains a BOM`);
  const base = path.basename(f);
  if (!UNLAYERED_DEFAULTS.includes(base) && content.trim() !== "") {
    assert(content.startsWith("@layer openui{"), `${f} is not wrapped in @layer openui`);
  }
}

if (failures.length > 0) {
  console.error("CSS artifact check FAILED:\n - " + failures.join("\n - "));
  process.exit(1);
}
console.log(`CSS artifact check passed (${layered.length} layered files verified).`);
