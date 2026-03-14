import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { encoding_for_model } from "tiktoken";
import { createParser } from "../packages/react-lang/src/parser/parser.ts";
import { toCompactOpenUI } from "./compact-openui.ts";

const SAMPLES_DIR = "samples";
const enc = encoding_for_model("gpt-5");

const schema = JSON.parse(readFileSync("schema.json", "utf-8"));
const parser = createParser(schema);

function main() {
  const files = readdirSync(SAMPLES_DIR).filter(f => f.endsWith(".oui"));

  let oldTotal = 0;
  let newTotal = 0;

  for (const file of files) {
    const fullPath = join(SAMPLES_DIR, file);
    const original = readFileSync(fullPath, "utf-8");

    const parsedOriginal = parser.parse(original);
    if (!parsedOriginal.root) {
      throw new Error(`Could not parse ${file} into a root element`);
    }

    const compact = toCompactOpenUI(parsedOriginal.root, schema);

    const parsedCompact = parser.parse(compact);
    if (!parsedCompact.root) {
      throw new Error(`Compacted output no longer parses for ${file}`);
    }

    if (JSON.stringify(parsedOriginal.root) !== JSON.stringify(parsedCompact.root)) {
      throw new Error(`Fidelity mismatch for ${file}: compact form changed the parsed UI tree`);
    }

    const oldTokens = enc.encode(original).length;
    const newTokens = enc.encode(compact).length;
    oldTotal += oldTokens;
    newTotal += newTokens;

    writeFileSync(fullPath, compact, "utf-8");
    console.log(`${file}: ${oldTokens} -> ${newTokens} tokens`);
  }

  const pct = oldTotal > 0 ? (((oldTotal - newTotal) / oldTotal) * 100).toFixed(1) : "0.0";
  console.log(`TOTAL: ${oldTotal} -> ${newTotal} tokens (${pct}% reduction)`);

  enc.free();
}

main();
