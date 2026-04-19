import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);

// Resolve react-ui's package.json through Node's resolver so this works
// regardless of where pnpm hoists the dependency.
const reactUiPkg = require.resolve("@openuidev/react-ui/package.json");
const reactUiRoot = dirname(reactUiPkg);

const inputs = [
  resolve(reactUiRoot, "dist/styles/openui-defaults.css"),
  resolve(reactUiRoot, "dist/components/index.css"),
];

const combined = inputs.map((p) => readFileSync(p, "utf8")).join("\n");
writeFileSync("dist/openui-styles.css", combined);
console.log(
  `wrote dist/openui-styles.css (${combined.length.toLocaleString()} bytes)`,
);
