/**
 * tsdown is configured with `external: [/\.css$/]`, so it emits the JS with the
 * `import "./theme.css"` specifiers intact but copies no stylesheets. This does
 * three things:
 *
 *   1. copies every stylesheet under src/ into dist/, so those imports resolve;
 *   2. concatenates them into dist/styles.css for hosts without a bundler,
 *      including maplibre-gl's own sheet, which Map imports and which the kit's
 *      map.css is written to override;
 *   3. verifies that every .css import left in dist actually resolves, so a
 *      stylesheet added later cannot ship as a dangling import.
 */
import { createRequire } from "node:module";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const require = createRequire(import.meta.url);
const fail = (message) => {
  console.error(`css: ${message}`);
  process.exit(1);
};

/** Every stylesheet under a directory, as paths relative to it. */
const sheetsUnder = (root) => {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".css")) out.push(relative(root, full));
    }
  };
  walk(root);
  return out.sort();
};

// Cascade order is deliberate: tokens, then components, then maplibre's base
// styles, then the kit's map.css which overrides them. ORDER is checked against
// what is actually on disk below, so adding a stylesheet without placing it
// here fails the build rather than silently dropping out of styles.css.
const ORDER = [
  "lib/components/theme.css",
  "lib/components/components.css",
  "lib/components/Map/map.css",
];

const found = sheetsUnder("src");
const missing = found.filter((s) => !ORDER.includes(s));
const stale = ORDER.filter((s) => !found.includes(s));
if (missing.length) fail(`stylesheet not listed in ORDER: ${missing.join(", ")} (add it, in cascade order)`);
if (stale.length) fail(`ORDER lists a stylesheet that no longer exists: ${stale.join(", ")}`);

// 1. copy each sheet so the emitted imports resolve
for (const rel of found) {
  const to = join("dist", rel);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(join("src", rel), to);
}

// 2. concatenate, with maplibre's sheet ahead of the kit's overrides
const maplibre = require.resolve("maplibre-gl/dist/maplibre-gl.css");
const parts = [];
for (const rel of ORDER) {
  if (rel === "lib/components/Map/map.css") {
    parts.push(`/* maplibre-gl/dist/maplibre-gl.css */\n${readFileSync(maplibre, "utf8")}`);
  }
  parts.push(`/* ${rel} */\n${readFileSync(join("src", rel), "utf8")}`);
}
writeFileSync(join("dist", "styles.css"), parts.join("\n\n"));

// 3. every .css import left in dist must resolve
const jsUnder = (root) => {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(mjs|cjs|js)$/.test(entry.name)) out.push(full);
    }
  };
  walk(root);
  return out;
};

let checked = 0;
for (const file of jsUnder("dist")) {
  const code = readFileSync(file, "utf8");
  for (const match of code.matchAll(/(?:from|import|require\()\s*["']([^"']+\.css)["']/g)) {
    const spec = match[1];
    checked++;
    if (spec.startsWith(".")) {
      if (!existsSync(resolve(dirname(file), spec))) fail(`${relative(".", file)} imports "${spec}", which is not in dist`);
    } else {
      try {
        require.resolve(spec);
      } catch {
        fail(`${relative(".", file)} imports "${spec}", which does not resolve from this package`);
      }
    }
  }
}

console.log(`css: copied ${found.length} stylesheets, wrote dist/styles.css, verified ${checked} css imports`);
