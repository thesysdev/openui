import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { defineConfig } from "tsdown";

const componentEntries = Object.fromEntries(
  readdirSync("src/components")
    .filter(
      (dir) =>
        statSync(join("src/components", dir)).isDirectory() &&
        existsSync(join("src/components", dir, "index.ts")),
    )
    .map((dir) => [`components/${dir}/index`, `src/components/${dir}/index.ts`]),
);

const shared = {
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
  // Main index — CJS + bundled .d.cts
  { ...shared, format: ["cjs"], dts: true, entry: { index: "src/index.ts" } },
  // Main index — ESM + bundled .d.mts
  { ...shared, format: ["esm"], dts: true, entry: { index: "src/index.ts" } },
  // genui-lib — CJS + .d.cts (own outDir so dts lands at dist/genui-lib/index.d.cts)
  {
    ...shared,
    format: ["cjs"],
    dts: true,
    outDir: "dist/genui-lib",
    entry: { index: "src/genui-lib/index.ts" },
  },
  // genui-lib — ESM + .d.mts (own outDir so dts lands at dist/genui-lib/index.d.mts)
  {
    ...shared,
    format: ["esm"],
    dts: true,
    outDir: "dist/genui-lib",
    entry: { index: "src/genui-lib/index.ts" },
  },
  // Individual components — CJS only
  { ...shared, format: ["cjs"], entry: componentEntries },
]);
