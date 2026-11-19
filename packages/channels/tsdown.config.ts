import { defineConfig, type UserConfig } from "tsdown";

// One outDir per subpath so each folder's index.ts emits dist/<name>/index.d.ts
// (a single multi-entry build names every index.ts declaration index<N>.d.ts).
const shared: UserConfig = {
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  deps: {
    neverBundle: [/^(?![./]|[A-Za-z]:[/\\])/],
  },
};

const subpath = (name: string): UserConfig => ({
  ...shared,
  entry: { index: `src/${name}/index.ts` },
  outDir: `dist/${name}`,
  clean: false,
});

export default defineConfig([
  { ...shared, entry: { index: "src/index.ts" }, outDir: "dist", clean: true },
  subpath("slack"),
  subpath("teams"),
  subpath("telegram"),
  subpath("whatsapp"),
  subpath("ui"),
  // The chart rasterizer carries the optional react/recharts/resvg peers, so it
  // is its own subpath: @openuidev/channels/ui/charts.
  { ...shared, entry: { charts: "src/ui/charts.tsx" }, outDir: "dist/ui", clean: false },
]);
