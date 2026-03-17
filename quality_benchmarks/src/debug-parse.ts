import { readFileSync } from "fs";
import { suite2a } from "./functional/2a.js";
import { parseLangOutput } from "./formats/lang.js";

const tc = suite2a.cases.find(c => c.id === "2a-hard")!;
const raw = readFileSync("targeted-results/2a-hard-lang-run1.txt", "utf-8");
const langResult = parseLangOutput(raw, tc.langSchema!);

console.log("error:", langResult.error);
console.log("validationErrors:", langResult.validationErrors);
console.log("parsed is null:", langResult.parsed === null);

if (langResult.parsed) {
  const m = langResult.parsed as any;
  console.log("\nkeys:", Object.keys(m));
  console.log("JSON (first 500):", JSON.stringify(m).slice(0, 500));
  console.log("\nname:", m.name);
  console.log("HardStateMachine key:", m.HardStateMachine ? "EXISTS" : "MISSING");
  // Maybe it's nested under the type name?
  if (m.HardStateMachine) {
    const h = m.HardStateMachine;
    console.log("  name:", h.name);
    console.log("  transitions count:", h.transitions?.length ?? "UNDEFINED");
  }
}

// Also try verify
if (langResult.parsed) {
  try {
    const result = tc.verify(langResult.parsed);
    console.log("\nverify pass:", result.pass);
    const failing = result.checks.filter(c => !c.pass);
    for (const c of failing) console.log(`  ✗ ${c.label}: expected ${JSON.stringify(c.expected)}, got ${JSON.stringify(c.actual)}`);
  } catch (e) {
    console.log("\nverify CRASH:", e instanceof Error ? e.message : String(e));
    console.log("stack:", e instanceof Error ? e.stack?.split("\n").slice(0, 5).join("\n") : "");
  }
}
