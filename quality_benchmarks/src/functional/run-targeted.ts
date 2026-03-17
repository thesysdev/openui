import "dotenv/config";
import { mkdirSync, writeFileSync } from "fs";
import OpenAI from "openai";
import { z } from "zod";
import { parseLangOutput } from "../formats/lang.js";
import { suite2a } from "./2a.js";
import { suite2b } from "./2b.js";
import { suite2c } from "./2c.js";
import { suite2d } from "./2d.js";
import type { FunctionalTestSuite } from "./domain.js";

// ---- CLI args ----
// Usage: pnpm tsx src/functional/run-targeted.ts [model] [runs] [format]
// model: gpt-5.4 | gpt-4o | gpt-4.1 | gpt-5-mini | all (default: all)
// runs: number (default: 3)
// format: lang | json | both (default: lang)

const args = process.argv.slice(2);
const modelArg = args[0] || "all";
const RUNS = parseInt(args[1] || "3", 10);
const formatArg = (args[2] || "lang") as "lang" | "json" | "both";
const formats: ("lang" | "json")[] = formatArg === "both" ? ["json", "lang"] : [formatArg];

interface ModelConfig {
  id: string;
  reasoningEffort?: string;
  omitTemperature?: boolean;
}

const ALL_MODELS: ModelConfig[] = [
  { id: "gpt-5.4", reasoningEffort: "none" },
  { id: "gpt-4o" },
  { id: "gpt-4.1" },
  { id: "gpt-5-mini", reasoningEffort: "minimal", omitTemperature: true },
];

const MODELS = modelArg === "all"
  ? ALL_MODELS
  : ALL_MODELS.filter(m => m.id === modelArg);

if (MODELS.length === 0) {
  console.error(`Unknown model: ${modelArg}. Use: gpt-5.4 | gpt-4o | gpt-5-mini | all`);
  process.exit(1);
}

const SUITES: FunctionalTestSuite[] = [suite2a, suite2b, suite2c, suite2d];
const OUT_DIR = "targeted-results";
mkdirSync(OUT_DIR, { recursive: true });

const client = new OpenAI();

function buildJsonSystemPrompt(schema: z.ZodType): string {
  const jsonSchema = z.toJSONSchema(schema);
  return `You are an expert software engineer and system architect.
Generate a structured plan, configuration, or specification based on the requirements provided.
Output ONLY valid JSON that conforms to this schema. No markdown, no code fences, no explanation.

Schema:
${JSON.stringify(jsonSchema, null, 2)}`;
}

interface ResultRow { model: string; format: string; test: string; name: string; complexity: string; pass: number; total: number; }
const results: ResultRow[] = [];

for (const model of MODELS) {
  for (const format of formats) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`MODEL: ${model.id} | ${format.toUpperCase()} | ${RUNS} run(s)`);
    console.log("=".repeat(60));

    let total = 0, passed = 0;

    for (const suite of SUITES) {
      for (const tc of suite.cases) {
        if (format === "lang" && !tc.langSchema) continue;
        let casePass = 0;

        const systemPrompt = format === "lang"
          ? tc.langSchema!.prompt({
              preamble: "You are an expert software engineer and system architect. Generate a structured plan, configuration, or specification based on the requirements provided.",
            })
          : buildJsonSystemPrompt(tc.schema);

        const runPromises = Array.from({ length: RUNS }, async (_, i) => {
          const run = i + 1;
          let parseError: string | null = null;
          let parsed: unknown = null;
          let rawOutput = "";
          let promptTokens = 0, completionTokens = 0;

          try {
            const requestParams: Record<string, unknown> = {
              model: model.id,
              ...(model.omitTemperature ? {} : { temperature: 0 }),
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: tc.prompt },
              ],
            };
            if (model.reasoningEffort) requestParams.reasoning_effort = model.reasoningEffort;

            const response = await (client.chat.completions.create as any)(requestParams) as any;
            rawOutput = response.choices[0]?.message?.content ?? "";
            promptTokens = response.usage?.prompt_tokens ?? 0;
            completionTokens = response.usage?.completion_tokens ?? 0;

            if (format === "lang") {
              const langResult = parseLangOutput(rawOutput, tc.langSchema!);
              if (langResult.error) {
                parseError = langResult.error + (langResult.validationErrors.length > 0 ? `: ${langResult.validationErrors.join("; ")}` : "");
              }
              parsed = langResult.parsed;
            } else {
              const stripped = rawOutput.trim().replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
              const json = JSON.parse(stripped);
              const result = tc.schema.safeParse(json);
              if (!result.success) {
                parseError = `Schema validation: ${result.error.issues.map((i: any) => `${i.path.join(".")}: ${i.message}`).join("; ")}`;
                parsed = json;
              } else {
                parsed = result.data;
              }
            }
          } catch (e) {
            parseError = e instanceof Error ? e.message : String(e);
          }

          writeFileSync(`${OUT_DIR}/${model.id}-${tc.id}-${format}-run${run}.txt`, rawOutput, "utf-8");

          let verificationResult = null;
          if (parsed !== null) {
            try { verificationResult = tc.verify(parsed); } catch (e) {
              parseError = (parseError ? parseError + "; " : "") + `Verify error: ${e instanceof Error ? e.message : String(e)}`;
            }
          }

          const pass = verificationResult !== null && verificationResult.pass && parseError === null;
          const checksPass = verificationResult?.checks.filter((c: any) => c.pass).length ?? 0;
          const checksTotal = verificationResult?.checks.length ?? 0;
          return { run, pass, checksPass, checksTotal, parseError, verificationResult, promptTokens, completionTokens };
        });

        const runResults = await Promise.all(runPromises);

        for (const r of runResults) {
          total++;
          if (r.pass) { passed++; casePass++; }
          const icon = r.pass ? "✓" : "✗";
          console.log(`    run ${r.run}: ${r.checksPass}/${r.checksTotal} ${icon} | ${r.promptTokens}p ${r.completionTokens}c`);
          if (r.parseError) console.log(`      PARSE: ${r.parseError.slice(0, 150)}`);
          if (!r.pass && r.verificationResult) {
            const failing = r.verificationResult.checks.filter((c: any) => !c.pass).slice(0, 3);
            for (const c of failing) console.log(`      ✗ ${c.label}: expected ${JSON.stringify(c.expected)}, got ${JSON.stringify(c.actual)}`);
          }
        }

        console.log(`  [${tc.id}] ${tc.name} (${tc.complexity}) => ${casePass}/${RUNS}`);
        results.push({ model: model.id, format, test: tc.id, name: tc.name, complexity: tc.complexity, pass: casePass, total: RUNS });
      }
    }

    console.log(`\n  ${format.toUpperCase()} TOTAL for ${model.id}: ${passed}/${total}`);
  }
}

// Summary table
console.log(`\n\n${"=".repeat(80)}`);
console.log("SUMMARY TABLE");
console.log("=".repeat(80));

const tests = [...new Set(results.map(r => r.test))];
const modelIds = MODELS.map(m => m.id);
const colKeys = modelIds.flatMap(m => formats.map(f => `${m} ${f.toUpperCase()}`));

const header = ["Test", "Cmplx", ...colKeys].map(s => s.padEnd(16)).join(" | ");
console.log(header);
console.log("-".repeat(header.length));

for (const test of tests) {
  const rows = results.filter(r => r.test === test);
  const name = rows[0]?.name.slice(0, 16) ?? test;
  const complexity = rows[0]?.complexity ?? "";
  const cells = modelIds.flatMap(m => formats.map(f => {
    const r = rows.find(r => r.model === m && r.format === f);
    return r ? `${r.pass}/${r.total}` : "N/A";
  }));
  console.log([name.padEnd(16), complexity.padEnd(16), ...cells.map(c => c.padEnd(16))].join(" | "));
}

console.log("-".repeat(header.length));
for (const m of modelIds) {
  for (const f of formats) {
    const mr = results.filter(r => r.model === m && r.format === f);
    const tp = mr.reduce((a, r) => a + r.pass, 0);
    const tt = mr.reduce((a, r) => a + r.total, 0);
    console.log(`${m} ${f.toUpperCase()}: ${tp}/${tt}`);
  }
}
