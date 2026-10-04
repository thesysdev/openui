import { defineConfig } from "tsdown";
import packageJson from "./package.json" with { type: "json" };

export default defineConfig({
  entry: ["src/index.ts", "src/postinstall.ts", "src/cloud.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  clean: true,
  define: {
    __OPENUI_LANG_CORE_VERSION__: JSON.stringify(packageJson.version),
  },
  deps: {
    neverBundle: [/^(?![./]|[A-Za-z]:[/\\])/],
  },
});
