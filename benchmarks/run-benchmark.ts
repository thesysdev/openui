import { readFileSync } from "fs";
import { join } from "path";
import { encoding_for_model } from "tiktoken";

const enc = encoding_for_model("gpt-5");
const SAMPLES_DIR = "samples";
const SCENARIOS = [
  "simple-table",
  "chart-with-data",
  "contact-form",
  "dashboard",
  "pricing-page",
  "settings-panel",
  "e-commerce-product",
] as const;
const TPS = 60;

function countTokens(text: string) {
  return enc.encode(text).length;
}

function main() {
  console.log("\n# OpenUI Lang Benchmark Results\n");
  console.log(
    "| Scenario | YAML (Tokens) | Vercel JSON-Render (Tokens) | Thesys C1 JSON (Tokens) | OpenUI Lang (Tokens) | OpenUI vs YAML | OpenUI vs Vercel | OpenUI vs C1 |",
  );
  console.log("|---|---:|---:|---:|---:|---|---|---|");

  let totalYaml = 0;
  let totalVercel = 0;
  let totalC1 = 0;
  let totalOui = 0;

  for (const test of SCENARIOS) {
    const ouiText = readFileSync(join(SAMPLES_DIR, `${test}.oui`), "utf-8");
    const c1Text = readFileSync(join(SAMPLES_DIR, `${test}.c1.json`), "utf-8");
    const yamlText = readFileSync(join(SAMPLES_DIR, `${test}.yaml`), "utf-8");
    const vercelText = readFileSync(join(SAMPLES_DIR, `${test}.vercel.jsonl`), "utf-8");

    const ouiTokens = countTokens(ouiText);
    const c1Tokens = countTokens(c1Text);
    const yamlTokens = countTokens(yamlText);
    const vercelTokens = countTokens(vercelText);

    totalOui += ouiTokens;
    totalC1 += c1Tokens;
    totalYaml += yamlTokens;
    totalVercel += vercelTokens;

    const vsYaml = (((yamlTokens - ouiTokens) / yamlTokens) * 100).toFixed(1);
    const vsVercel = (((vercelTokens - ouiTokens) / vercelTokens) * 100).toFixed(1);
    const vsC1 = (((c1Tokens - ouiTokens) / c1Tokens) * 100).toFixed(1);

    console.log(
      `| ${test} | ${yamlTokens} | ${vercelTokens} | ${c1Tokens} | ${ouiTokens} | -${vsYaml}% | -${vsVercel}% | -${vsC1}% |`,
    );
  }

  console.log(
    `| **TOTAL** | **${totalYaml}** | **${totalVercel}** | **${totalC1}** | **${totalOui}** | **-${(((totalYaml - totalOui) / totalYaml) * 100).toFixed(1)}%** | **-${(((totalVercel - totalOui) / totalVercel) * 100).toFixed(1)}%** | **-${(((totalC1 - totalOui) / totalC1) * 100).toFixed(1)}%** |`,
  );

  console.log("\n## Estimated Latency (Based on LLM TPS)\n");
  console.log(
    "Assuming a constant generation speed of ~60 tokens per second (typical for this model).",
  );
  console.log(
    "\n| Scenario | YAML | Vercel JSON-Render | Thesys C1 JSON | OpenUI Lang | Speedup vs YAML | Speedup vs Vercel |",
  );
  console.log("|---|---:|---:|---:|---:|---|---|");

  for (const test of SCENARIOS) {
    const ouiText = readFileSync(join(SAMPLES_DIR, `${test}.oui`), "utf-8");
    const c1Text = readFileSync(join(SAMPLES_DIR, `${test}.c1.json`), "utf-8");
    const yamlText = readFileSync(join(SAMPLES_DIR, `${test}.yaml`), "utf-8");
    const vercelText = readFileSync(join(SAMPLES_DIR, `${test}.vercel.jsonl`), "utf-8");

    const ouiTokens = countTokens(ouiText);
    const c1Tokens = countTokens(c1Text);
    const yamlTokens = countTokens(yamlText);
    const vercelTokens = countTokens(vercelText);

    const ouiTime = (ouiTokens / TPS).toFixed(2);
    const c1Time = (c1Tokens / TPS).toFixed(2);
    const yamlTime = (yamlTokens / TPS).toFixed(2);
    const vercelTime = (vercelTokens / TPS).toFixed(2);

    console.log(
      `| ${test} | ${yamlTime}s | ${vercelTime}s | ${c1Time}s | ${ouiTime}s | ${(yamlTokens / ouiTokens).toFixed(2)}x faster | ${(vercelTokens / ouiTokens).toFixed(2)}x faster |`,
    );
  }
  enc.free();
}

main();
