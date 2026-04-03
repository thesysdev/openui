import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  clean: true,
  deps: {
    neverBundle: [/^[^./]/],
  },
});
