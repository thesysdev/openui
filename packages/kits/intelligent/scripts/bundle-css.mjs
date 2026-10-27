/**
 * tsdown emits the JS and leaves the `import "./theme.css"` specifiers in place,
 * but does not copy the stylesheets themselves. Copy them so those imports
 * resolve for bundler consumers, and concatenate them into dist/styles.css for
 * anyone loading the kit without a bundler ("@openuidev/intelligent-kit/styles.css").
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const SHEETS = [
  "lib/components/theme.css",
  "lib/components/components.css",
  "lib/components/map/map.css",
];

const parts = [];
for (const rel of SHEETS) {
  const from = join("src", rel);
  const to = join("dist", rel);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  parts.push(`/* ${rel} */\n${readFileSync(from, "utf8")}`);
}
writeFileSync(join("dist", "styles.css"), parts.join("\n\n"));
console.log(`css: copied ${SHEETS.length} stylesheets, wrote dist/styles.css`);
