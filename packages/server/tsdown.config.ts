import { fileURLToPath } from "node:url";
import { defineConfig } from "tsdown";

// Absolute, or the dts plugin names declarations index2.d.mts, index3.d.mts, ...
const src = (file: string) => fileURLToPath(new URL(`./src/${file}`, import.meta.url));

// One build, so shared code is one chunk and `instanceof` works across entries.
// Keys name the outputs: `openai/index` emits dist/openai/index.*, where package.json points.
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
