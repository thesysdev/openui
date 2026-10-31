import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/styles.ts"],
  unbundle: true,
  root: "src",
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  clean: true,
  deps: {
    alwaysBundle: [
      // Theme data is bundled so typed extensionless entries need no Node directory resolution.
      /^react-syntax-highlighter\/dist\/cjs\/styles\/prism(?:\/|$)/,
      // Goober keeps its prefixer (`setup`) and compiled-rule cache in module scope. A private
      // copy keeps a host app's Goober, whatever it sets up, away from component rules.
      /^goober$/,
    ],
  },
  // A bundled dependency would otherwise keep its path in the build machine's pnpm store, such as
  // dist/node_modules/.pnpm/goober@2.1.19_csstype@3.2.3/node_modules/goober/: named by peer
  // versions, so it moves when an unrelated peer changes, and inside a nested node_modules, which
  // tools treat as an installed package. Emit it under dist/vendor/<package>/ instead.
  outputOptions(options) {
    const names = options.entryFileNames;
    return {
      ...options,
      entryFileNames: (chunk) => {
        const name = typeof names === "function" ? names(chunk) : (names ?? "[name].js");
        // The path after the last node_modules, under any package manager's layout.
        const vendored = /^(?:.*\/)?node_modules\/(.+)$/.exec(chunk.name);
        return vendored ? name.replace("[name]", `vendor/${vendored[1]}`) : name;
      },
    };
  },
});
