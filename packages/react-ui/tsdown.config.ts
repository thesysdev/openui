import { defineConfig } from "tsdown";
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const componentEntries = Object.fromEntries(
  readdirSync("src/components")
    .filter(
      (dir) =>
        statSync(join("src/components", dir)).isDirectory() &&
        existsSync(join("src/components", dir, "index.ts"))
    )
    .map((dir) => [`components/${dir}/index`, `src/components/${dir}/index.ts`])
);

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
  { ...shared, entry: componentEntries },
]);
