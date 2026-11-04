import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { OpenAI } from "openai";
import { join } from "path";
import { createParser } from "../packages/react-lang/src/parser/parser.js";
import { astToThesysC1Json } from "./thesys-c1-converter.js";
import { astToVercelJsonl } from "./vercel-jsonl-converter.js";
import { astToYaml } from "./yaml-converter.js";

const systemPrompt = readFileSync(join(process.cwd(), "system-prompt.txt"), "utf-8");

// Load the combined JSON Schema produced by library.toJSONSchema().
// createParser reads component definitions from $defs so named props are
// correctly mapped (instead of falling back to positional _args).
const schemaStr = readFileSync(join(process.cwd(), "schema.json"), "utf-8");
const schema = JSON.parse(schemaStr);
const parser = createParser(schema);

// 1. Setup
const openai = new OpenAI();
const MODEL = "gpt-5.2";

const PROMPTS = {
  "simple-table":
    "Create a simple table showing 5 employees with columns for Name, Department, Salary, and YoY change.",
  "chart-with-data":
    "Create a dashboard with a metric card showing Total Revenue, and a BarChart showing 6 months of revenue data.",
  "contact-form":
    "Create a contact form with Name, Email, Phone, Subject dropdown, and Message text area. Include Submit and Cancel buttons.",
  dashboard:
    "Create a product analytics dashboard. It should have a Header, a BarChart for Monthly Active Users, a PieChart for User Acquisition, a Table for Top Features, and a LineChart for MRR and ARR.",
  "pricing-page":
    "Create a pricing page with 3 tiers: Basic, Pro, and Enterprise. Include a feature comparison table below the pricing cards.",
  "settings-panel":
    "Create a user settings panel with tabs for Profile, Security, and Notifications. The Profile tab should have a form to update name and avatar. The Security tab should have a toggle for 2FA.",
  "e-commerce-product":
    "Create a product detail page for a pair of sneakers. Include an ImageGallery, a title, price, size selector (Select), color options (RadioGroup), and an Add to Cart button.",
};

// 2. Generation Loop
async function main() {
  mkdirSync("samples", { recursive: true });
  const metrics: Record<string, any> = {};

  for (const [name, userPrompt] of Object.entries(PROMPTS)) {
    console.log(`Generating ${name}...`);

    const startTime = Date.now();
    let firstTokenTime = 0;
    let fullText = "";

    const stream = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      stream_options: { include_usage: true },
    });

    let usage = null;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        // Only record TTFT on the first chunk that actually contains content
        if (!firstTokenTime) firstTokenTime = Date.now();
        fullText += content;
      }
      if (chunk.usage) {
        usage = chunk.usage;
      }
    }

    const endTime = Date.now();
    const ttft = firstTokenTime - startTime;
    const totalDuration = endTime - startTime;
    const completionTokens = usage?.completion_tokens || 0;
    const tps = completionTokens / ((totalDuration - ttft) / 1000);

    metrics[name] = {
      ttft_ms: ttft,
      total_duration_ms: totalDuration,
      completion_tokens: completionTokens,
      tps: tps,
    };

    // Save OpenUI Lang
    writeFileSync(join("samples", `${name}.oui`), fullText);

    // Parse AST using createParser so named props are correctly mapped
    const ast = parser.parse(fullText).root;

    // Save Thesys C1 JSON (normalized component/props envelope)
    writeFileSync(join("samples", `${name}.c1.json`), astToThesysC1Json(ast));

    // Save Vercel JSONL
    writeFileSync(join("samples", `${name}.vercel.jsonl`), astToVercelJsonl(ast));

    // Save YAML spec payload (the content inside a yaml-spec fence)
    writeFileSync(join("samples", `${name}.yaml`), astToYaml(ast));

    console.log(`  Done! ${completionTokens} tokens @ ${tps.toFixed(1)} tok/s`);
  }

  writeFileSync(join("samples", "metrics.json"), JSON.stringify(metrics, null, 2));
  console.log("All samples generated and saved to ./samples/");
}

main().catch(console.error);
