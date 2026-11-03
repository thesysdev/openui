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
  // The styles are goober. maplibre-gl's and katex's sheets stay imports of those
  // packages, loaded on first use.
  external: [/\.css$/],
});
