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
  // The styles are goober; only the tokens are a stylesheet, because their
  // selectors reach elements the kit does not class. It ships as a file, and
  // maplibre-gl's and katex's sheets stay imports of those packages.
  external: [/\.css$/],
  copy: [{ from: "src/shared/theme.css", to: "dist/shared" }],
});
