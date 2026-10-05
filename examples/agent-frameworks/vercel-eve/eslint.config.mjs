import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // ESLint's flat config only auto-ignores node_modules, so mirror the build
  // artifacts from .gitignore (the eve/next/nitro output dirs ship huge bundles
  // that would otherwise blow the parser's stack).
  globalIgnores([
    ".next/**",
    ".eve/**",
    ".output/**",
    ".nitro/**",
    ".vercel/**",
    ".workflow-data/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
    "scripts/**",
  ]),
]);

export default eslintConfig;
