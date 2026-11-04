import { defineConfig, type UserConfig } from "tsdown";

const shared = {
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  clean: true,
  deps: {
    neverBundle: [/^(?![./]|[A-Za-z]:[/\\])/],
  },
} satisfies UserConfig;

export default defineConfig([
  { ...shared, entry: { index: "src/index.ts" } },
  // React Native: prefer `*.native.tsx` siblings (e.g. components/index.native.tsx) the
  // way Metro would. Metro can't do this itself because dist is bundled.
  {
    ...shared,
    entry: { "index.native": "src/index.native.ts" },
    tsconfig: "tsconfig.native.json",
    // TypeScript's resolver honors the tsconfig's moduleSuffixes; the default
    // oxc resolver would bundle the web host types into index.native.d.*ts.
    dts: { resolver: "tsc" },
    inputOptions: {
      resolve: { extensions: [".native.tsx", ".native.ts", ".tsx", ".ts", ".js"] },
    },
  },
]);
