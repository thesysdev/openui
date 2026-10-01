// Writes src/lib/PROMPT.md, a readable copy of the F1 agent's system prompt rules and
// examples from src/lib/prompt.ts. Run after editing the prompt: npm run prompt:md
import { writeFileSync } from "node:fs";
import { promptExamples, promptRules } from "../src/lib/prompt";

const rules = promptRules({
  today: "<today>",
  season: "<one line on the season's progress, from get_schedule>",
  entrants: ["<CODE number Name (Team), one per current entrant>"],
  miamiDrivers: [{ number: 0, name: "<legacy 2024 Miami dataset, when prepared>" } as never],
});

const md = [
  "# Shiro: system prompt",
  "",
  "Generated from `src/lib/prompt.ts` by `npm run prompt:md`. Do not edit by hand.",
  "",
  "The Thesys Gateway prepends the OpenUI Lang syntax guide and the component specification (`src/generated/spec.json`); the app adds the rules and examples below. Angle-bracket values are filled in per request.",
  "",
  "## Rules",
  "",
  ...rules.flatMap((r, i) => [`${i + 1}. ${r}`, ""]),
  "## Examples",
  "",
  ...promptExamples.flatMap((e) => ["```", e.trimEnd(), "```", ""]),
].join("\n");

writeFileSync(new URL("../src/lib/PROMPT.md", import.meta.url), md);
console.log("Wrote src/lib/PROMPT.md");
