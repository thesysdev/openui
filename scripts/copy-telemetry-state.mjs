import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The CLI is compiled with plain tsc, which does not bundle the shared telemetry state module.
const destination = new URL("../packages/openui-cli/dist/", import.meta.url);
mkdirSync(destination, { recursive: true });
copyFileSync(
  fileURLToPath(new URL("../shared/telemetry/telemetry-state.cjs", import.meta.url)),
  fileURLToPath(new URL("telemetry-state.cjs", destination)),
);
