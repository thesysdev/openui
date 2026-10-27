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
  // The stylesheets ship as files, not inlined: tsdown leaves the
  // `import "./theme.css"` specifiers in place and scripts/bundle-css.mjs
  // copies the sheets next to them (and concatenates dist/styles.css).
  external: [/\.css$/],
});
