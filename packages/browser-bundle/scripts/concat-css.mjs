import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);

// Resolve via react-ui's declared subpath exports so we don't depend on
// pnpm's on-disk layout. We intentionally avoid resolving package.json here
// because react-ui's "exports" field doesn't expose it and the wildcard
// fallback mis-resolves the request.
const inputs = [
  require.resolve("@openuidev/react-ui/defaults.css"),
  require.resolve("@openuidev/react-ui/components.css"),
];

const combined = inputs.map((p) => readFileSync(p, "utf8")).join("\n");
writeFileSync("dist/openui-styles.css", combined);
console.log(
  `wrote dist/openui-styles.css (${combined.length.toLocaleString()} bytes)`,
);
