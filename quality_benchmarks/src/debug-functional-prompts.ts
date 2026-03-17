import { suite2a } from "./functional/2a.js";
import { suite2b } from "./functional/2b.js";
import { suite2c } from "./functional/2c.js";
import { suite2d } from "./functional/2d.js";

for (const suite of [suite2a, suite2b, suite2c, suite2d]) {
  for (const tc of suite.cases) {
    if (!tc.langSchema) continue;
    const prompt = tc.langSchema.prompt({
      preamble: "You are an expert software engineer and system architect. Generate a structured plan, configuration, or specification based on the requirements provided.",
    });
    console.log(`\n${"=".repeat(80)}`);
    console.log(`${suite.name} — ${tc.name} (${tc.complexity})`);
    console.log(`${"=".repeat(80)}`);
    console.log(prompt);
  }
}
