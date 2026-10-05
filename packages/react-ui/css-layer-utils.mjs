import fs from "fs";
import path from "path";

// Strip a leading UTF-8 BOM (U+FEFF). Sass emits one in compressed mode for
// files with non-ASCII output. A browser drops it at byte 0, but it is noise in
// shipped artifacts and becomes fatal if the content is ever wrapped \u2014 the BOM
// would land mid-stylesheet inside a layer block, where U+FEFF parses as an
// identifier and kills the first rule (e.g. the :root theme tokens; the 2026-06
// incident). Used for both the unlayered defaults (cp-css.js) and the layered
// mirror (wrapInLayer below).
export function stripBom(content) {
  return content.replace(/^\uFEFF/, "");
}

// Wrap a CSS file's contents in @layer openui { ... } if not already wrapped.
// Idempotency check protects watch-mode and back-to-back builds.
export function wrapInLayer(content) {
  content = stripBom(content);
  if (content.trim() === "") return content;
  if (/^\s*@layer\s+openui\b/.test(content)) return content;
  return `@layer openui{${content}}`;
}

// Write a layered copy of srcFile at destFile, creating parent directories.
export function writeLayeredCopy(srcFile, destFile) {
  const content = fs.readFileSync(srcFile, "utf8");
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.writeFileSync(destFile, wrapInLayer(content), "utf8");
}

// Mirror every top-level *.css file in srcDir into destDir wrapped in
// @layer openui. Files named in `unwrapped` are copied verbatim — they must
// stay in the unlayered cascade (openui-defaults.css backs the runtime
// theming override contract, and its scheme-pinned variants). Non-CSS files
// (e.g. cssUtils.scss) are skipped.
export const UNLAYERED_DEFAULTS = [
  "openui-defaults.css",
  "openui-defaults-light.css",
  "openui-defaults-dark.css",
];

export function mirrorStylesWithLayer(srcDir, destDir, unwrapped = UNLAYERED_DEFAULTS) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    if (!name.endsWith(".css")) continue;
    const src = path.join(srcDir, name);
    if (!fs.statSync(src).isFile()) continue;
    if (unwrapped.includes(name)) {
      fs.copyFileSync(src, path.join(destDir, name));
    } else {
      writeLayeredCopy(src, path.join(destDir, name));
    }
  }
}
