import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: false,
  sourcemap: true,
  clean: false,
  treeshake: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    /^plotly\.js/,
    "plotly.js-dist-min",
    /^react-plotly\.js/,
    /^@openuidev\//,
    /^zod/,
  ],
});
