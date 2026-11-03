import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  unbundle: true,
  root: "src",
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  clean: true,
  // maplibre-gl's and KaTeX's own sheets stay imports of those packages, loaded on first use.
  external: [/\.css$/],
});
