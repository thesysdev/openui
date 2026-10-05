import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

export default defineConfig({
  define: {
    // Mirrors the tsdown define so src imports resolve SDK_VERSION in tests.
    __SDK_VERSION__: JSON.stringify(version),
  },
});
