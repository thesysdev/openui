// Pre-publish guard for the JS entry contract:
//   - every component subpath (`@openuidev/react-ui/<Component>`) loads under
//     Node as both ESM and CJS (the ESM subpaths once pointed at tsc output
//     with extensionless imports, which Node's ESM loader cannot resolve)
//   - the root, genui-lib, and subpath bundles share one ThemeContext, so a
//     ThemeProvider from one entry themes hooks imported from another
import fs from "fs";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const failures = [];

const components = fs
  .readdirSync(path.join(dirname, "dist/components"))
  .filter((dir) => fs.existsSync(path.join(dirname, "dist/components", dir, "index.cjs")));

const load = async (specifier) => {
  const loaded = {};
  try {
    loaded.esm = await import(specifier);
  } catch (error) {
    failures.push(`${specifier} (ESM): ${String(error.message).split("\n")[0]}`);
  }
  try {
    loaded.cjs = require(specifier);
  } catch (error) {
    failures.push(`${specifier} (CJS): ${String(error.message).split("\n")[0]}`);
  }
  return loaded;
};

const root = await load("@openuidev/react-ui");
await load("@openuidev/react-ui/genui-lib");
const subpaths = {};
for (const dir of components) subpaths[dir] = await load(`@openuidev/react-ui/${dir}`);

const contexts = [root.esm, root.cjs, subpaths.ThemeProvider?.esm, subpaths.ThemeProvider?.cjs]
  .filter(Boolean)
  .map((entry) => entry.ThemeContext);
if (contexts.length !== 4 || contexts.some((context) => context !== contexts[0])) {
  failures.push("ThemeContext differs between the root and ThemeProvider entries (ESM/CJS)");
}

if (failures.length > 0) {
  console.error("Subpath export check failed:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log(`Subpath export check passed (${components.length} components, ESM and CJS).`);
