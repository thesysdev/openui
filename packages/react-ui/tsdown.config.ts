import { defineConfig } from "tsdown";

const shared = {
  format: ["cjs"],
  dts: false,
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  clean: false,
  deps: {
    neverBundle: [/^[^./]/, /\.scss$/, /\.css$/],
  },
} satisfies Parameters<typeof defineConfig>[0];

export default defineConfig([
  { ...shared, entry: { index: "src/index.ts" } },
  { ...shared, entry: { "genui-lib/index": "src/genui-lib/index.ts" } },
]);
