import { defineConfig, type UserConfig } from "tsdown";

// One outDir per entry so each folder's index.ts emits dist/<name>/index.d.ts.
const shared: UserConfig = {
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  deps: {
    neverBundle: [/^(?![./]|[A-Za-z]:[/\\])/],
  },
};

export default defineConfig([
  {
    ...shared,
    entry: { index: "src/index.ts" },
    outDir: "dist",
    clean: true,
  },
  {
    ...shared,
    entry: { index: "src/openai/index.ts" },
    outDir: "dist/openai",
    clean: false,
  },
  {
    ...shared,
    entry: { index: "src/vercel/index.ts" },
    outDir: "dist/vercel",
    clean: false,
  },
]);
