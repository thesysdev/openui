// Regenerate golden.json from the current code. Run when an output change is
// INTENDED (new component, changed contract), then review the fixture diff:
//   npm run golden
import { writeFileSync } from "node:fs";
import { buildScenarios } from "./scenarios";

const out = await buildScenarios();
writeFileSync(new URL("./golden.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(`wrote golden.json with ${Object.keys(out).length} scenarios`);
