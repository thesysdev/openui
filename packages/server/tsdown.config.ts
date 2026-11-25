import { fileURLToPath } from "node:url";
import { defineConfig } from "tsdown";

// Absolute, so the declaration plugin matches each file to its entry name; with relative
// paths it misses and names the declarations index2.d.mts, index3.d.mts, ...
const src = (file: string) => fileURLToPath(new URL(`./src/${file}`, import.meta.url));

// One build for every entry, so the code they share is one chunk: an error class is the same
// class whichever entry throws it, and `instanceof` works across entries. The object keys name
// the outputs, so `openai/index` emits dist/openai/index.{mjs,cjs,d.mts,d.cts}, where
// package.json's `exports` and `typesVersions` point.
export default defineConfig({
  entry: {
    index: src("index.ts"),
    "openai/index": src("openai/index.ts"),
    "vercel/index": src("vercel/index.ts"),
    "langgraph/index": src("langgraph/index.ts"),
  },
  outDir: "dist",
  clean: true,
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  deps: {
    neverBundle: [/^(?![./]|[A-Za-z]:[/\\])/],
  },
});
