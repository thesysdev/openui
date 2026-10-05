import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// This build bundles lucide-react in and aliases the rest to
// browser-shims/*.
const shim = (name) => fileURLToPath(new URL(`../src/browser-shims/${name}.ts`, import.meta.url));

await build({
  entryPoints: [fileURLToPath(new URL("../src/browser.ts", import.meta.url))],
  outfile: fileURLToPath(new URL("../dist/devtools.browser.js", import.meta.url)),
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  sourcemap: true,
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"development"',
  },
  alias: {
    react: shim("react"),
    "react-dom": shim("react-dom"),
    "react/jsx-runtime": shim("jsx-runtime"),
    "@openuidev/observability": shim("observability"),
    "@openuidev/react-lang": shim("react-lang"),
  },
});

console.log("wrote dist/devtools.browser.js");
