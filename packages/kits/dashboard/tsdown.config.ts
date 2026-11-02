import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/lib/index.ts"],
  unbundle: true,
  root: "src",
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  clean: true,
});
