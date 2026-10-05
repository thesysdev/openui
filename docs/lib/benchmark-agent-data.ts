import {
  BENCHMARK_UPDATED,
  BENCHMARK_VERSION,
  blankScreens,
  BRIEFS,
  completionByDensity,
  completionByModel,
  completionOver,
  costPerPass,
  FORMAT_ORDER,
  formatLabel,
  FORMATS,
  LINKS,
  MODEL_BOARD_FAMILIES,
  modelBoardCostPerTask,
  modelBoardDefaultSelected,
  modelBoardFamilyFor,
  modelBoardFrontier,
  MODELS,
  OPENUI_MODEL_BOARD,
  production,
  repairFunnel,
  runCounts,
  RUNS_PER_FORMAT,
  RUNS_TOTAL,
  tokens,
} from "@/lib/benchmark-data";
import { BASE_URL } from "@/lib/source";

export const BENCHMARK_CANONICAL_URL = `${BASE_URL}/benchmarks`;
export const BENCHMARK_DATASET_NAME = "OpenUI Generative UI Benchmark";
export const BENCHMARK_SCHEMA_URL = `${BENCHMARK_CANONICAL_URL}/data.schema.json`;
export const LANGUAGE_BENCHMARK_URL = `${BENCHMARK_CANONICAL_URL}/language`;
export const FRAMEWORK_BENCHMARK_URL = `${BENCHMARK_CANONICAL_URL}/framework`;
export const MODEL_BOARD_UPDATED_ISO = "2026-08-25";
export const BENCHMARK_UPDATED_ISO = "2026-08-18";

const frontierIds = new Set(modelBoardFrontier().map((point) => point.id));

export const modelBoardRows = OPENUI_MODEL_BOARD.map((point) => {
  const family = modelBoardFamilyFor(point.id);
  const familyOrder = family ? family.models.indexOf(point.id as never) + 1 : null;
  const selfHosted = "unpriced" in point;
  const free = !selfHosted && point.costPerPass === 0;

  return {
    model_id: point.id,
    model_name: point.label,
    provider: point.provider,
    family_id: family?.id ?? point.id,
    family_name: family?.label ?? point.label,
    family_order: familyOrder,
    connected_family: false,
    default_selected: modelBoardDefaultSelected(point.id),
    format: "openui",
    validity_score_percent: point.score,
    cost_per_task_usd: selfHosted ? null : modelBoardCostPerTask(point),
    cost_per_46_screen_pass_usd: selfHosted ? null : point.costPerPass,
    cost_type: selfHosted ? "self-hosted" : free ? "free" : "provider-list-price",
    serving: selfHosted && "serving" in point ? point.serving : null,
    pareto_frontier: !selfHosted && frontierIds.has(point.id),
    briefs: BRIEFS,
    generations_per_brief: 4,
    dataset_updated: MODEL_BOARD_UPDATED_ISO,
  };
});

export const formatComparisonRows = MODELS.flatMap((model) =>
  FORMAT_ORDER.map((format) => ({
    model_id: model.id,
    model_name: "family" in model && model.family ? `${model.family} ${model.label}` : model.label,
    provider: model.vendor,
    format_id: format,
    format_name: formatLabel(format),
    valid_runs: runCounts[model.id][format].complete,
    rendered_runs: runCounts[model.id][format].renderable,
    total_runs: runCounts[model.id][format].runs,
    validity_score_percent: completionByModel[model.id][format],
    render_rate_percent:
      (runCounts[model.id][format].renderable / runCounts[model.id][format].runs) * 100,
    cost_per_46_screen_pass_usd: costPerPass[model.id]?.[format] ?? null,
  })),
);

export const formatSummaryRows = FORMAT_ORDER.map((format) => ({
  format_id: format,
  format_name: formatLabel(format),
  validity_score_percent: completionOver(format),
  render_rate_percent: (1 - blankScreens[format] / RUNS_PER_FORMAT) * 100,
  blank_screens: blankScreens[format],
  runs: RUNS_PER_FORMAT,
  system_prompt_tokens: tokens.systemPrompt[format],
  mean_output_tokens_per_screen: tokens.outputPerScreen[format],
  estimated_stream_seconds_at_50_tps: tokens.outputPerScreen[format] / 50,
}));

const bestValidity = Math.max(...modelBoardRows.map((row) => row.validity_score_percent));
const bestValidityModels = modelBoardRows
  .filter((row) => row.validity_score_percent === bestValidity)
  .map((row) => row.model_name);
const openuiSummary = formatSummaryRows.find((row) => row.format_id === "openui")!;
const lowestPromptTokenFormat = [...formatSummaryRows].sort(
  (a, b) => a.system_prompt_tokens - b.system_prompt_tokens,
)[0];

export const benchmarkAgentAnswers = [
  {
    id: "benchmark-scope",
    question: "How large is the benchmark?",
    answer: `${BRIEFS} interface briefs are used. The format comparison covers ${MODELS.length} models and ${FORMATS.length} formats for ${RUNS_TOTAL.toLocaleString("en-US")} scored runs; the OpenUI model board covers ${OPENUI_MODEL_BOARD.length} models.`,
    evidence_paths: ["scope", "model_board", "format_comparison"],
  },
  {
    id: "valid-definition",
    question: "What counts as a valid generation?",
    answer:
      "A generation must parse, have a root, resolve every reference, contain no orphaned or invented components, use valid props, avoid truncation, and meet the component-count floor.",
    evidence_paths: ["definitions.valid"],
  },
  {
    id: "highest-model-validity",
    question: "Which models have the highest OpenUI validity score?",
    answer: `${bestValidityModels.join(" and ")} tie for the highest measured validity score at ${bestValidity.toFixed(1)}%. Cost determines which of these is Pareto-efficient; a high score alone does not imply frontier membership.`,
    evidence_paths: ["model_board"],
  },
  {
    id: "openui-format-result",
    question: "How did OpenUI perform in the format comparison?",
    answer: `OpenUI achieved ${openuiSummary.validity_score_percent.toFixed(1)}% structural validity and ${openuiSummary.render_rate_percent.toFixed(1)}% render success across ${openuiSummary.runs.toLocaleString("en-US")} runs, with ${openuiSummary.blank_screens} blank screen.`,
    evidence_paths: ["format_summary"],
  },
  {
    id: "prompt-token-result",
    question: "Which format used the fewest system-prompt tokens?",
    answer: `${lowestPromptTokenFormat.format_name} used the fewest system-prompt tokens at ${lowestPromptTokenFormat.system_prompt_tokens.toLocaleString("en-US")}.`,
    evidence_paths: ["format_summary"],
  },
  {
    id: "self-hosted-cost",
    question: "Does a zero or missing cost mean a self-hosted model is free?",
    answer:
      "No. Self-hosted models have no comparable API list price, so their cost is null. A numeric zero is reserved for a source reporting zero marginal API price.",
    evidence_paths: ["definitions.cost_type", "model_board"],
  },
  {
    id: "pareto-meaning",
    question: "What does Pareto frontier mean in this benchmark?",
    answer:
      "A priced model is on the frontier when no other comparably priced model is at least as valid while being strictly better on cost or validity. Frontier membership is a cost-quality trade-off, not a general model ranking.",
    evidence_paths: ["definitions.pareto_frontier", "model_board"],
  },
  {
    id: "chart-views",
    question: "What do the two tabs at the top of the benchmark show?",
    answer:
      "Model comparison shows OpenUI structural validity and cost across ${MODEL_BOARD_SIZE} models as provider-coloured dots with one Pareto frontier. Models scoring below 70% structural validity are deselected by default but remain in the data; both axes rescale to whatever is selected, so selecting a lower-scoring model extends the vertical scale down to reach it. Format comparison shows structural validity and cost across OpenUI, A2UI, and json-render for six models. Exact values for both views are present in the page's server-rendered chart data tables and machine-readable distributions.",
    evidence_paths: ["model_board", "model_families", "format_comparison", "distributions"],
  },
] as const;

export const benchmarkAgentDataset = {
  $schema: BENCHMARK_SCHEMA_URL,
  schema_version: "1.0.0",
  dataset: {
    name: BENCHMARK_DATASET_NAME,
    canonical_url: BENCHMARK_CANONICAL_URL,
    version: BENCHMARK_VERSION,
    benchmark_updated: BENCHMARK_UPDATED_ISO,
    model_board_updated: MODEL_BOARD_UPDATED_ISO,
    benchmark_updated_label: BENCHMARK_UPDATED,
    currency: "USD",
    pricing_basis: "Measured tokens at provider list prices unless cost_type says otherwise.",
    maintainer: "OpenUI by Thesys",
    first_party_disclosure: "OpenUI built and maintains this first-party benchmark.",
  },
  definitions: {
    valid:
      "Parses, has a root, resolves every reference, has no orphaned or invented components, uses valid props, is not truncated, and meets the component-count floor.",
    render_success: "The format's own shipped renderer produced a non-blank screen.",
    cost_per_task_usd: "Measured cost of one generated screen, in USD.",
    cost_type: {
      "provider-list-price":
        "Comparable API price calculated from measured tokens and list prices.",
      free: "The source reports zero marginal API price.",
      "self-hosted": "No comparable API price; cost_per_task_usd is null, never zero.",
    },
    pareto_frontier:
      "True when no other comparably priced model is at least as valid and strictly better on cost or validity.",
    family_order:
      "One-based catalog order within a named model family; null for singleton models. Families are not connected in the chart.",
    connected_family:
      "Whether members of a model family are connected by a chart line. False for every row in this chart version.",
    default_selected:
      "Whether the model is selected in the chart's opening view, which is every model at or above 70% structural validity.",
    generation_condition:
      "Four generations per brief, a 16,384-token output ceiling, temperature 0.7 where the provider accepts it, and minimal or no reasoning. Anthropic runs use the model default temperature because that API rejects the benchmark temperature setting for the tested model.",
    scorer_regime:
      "Every row is scored by one build of the shipped OpenUI parser, lang-core 0.2.16, whose parser validates enum and scalar prop values. The website and the benchmark repository are on the same regime; raw outputs and per-run verdicts are committed for independent rescoring.",
  },
  scope: {
    briefs: BRIEFS,
    formats: FORMATS.length,
    comparison_models: MODELS.length,
    model_board_models: OPENUI_MODEL_BOARD.length,
    runs_per_format: RUNS_PER_FORMAT,
    total_scored_runs: RUNS_TOTAL,
  },
  provenance: {
    format_comparison: {
      evidence_status: "published",
      scorer_regime: "lang-core 0.2.16",
      raw_results: LINKS.rawData,
      raw_outputs: LINKS.rawOutputs,
      harness: LINKS.harness,
      briefs: LINKS.briefs,
    },
    model_board: {
      evidence_status: "summary-only",
      note: "The model-board measurements are published here as summary rows. Raw generations and per-run verdicts for every row are committed in the benchmark repository for independent rescoring.",
      raw_results: null,
    },
  },
  model_families: MODEL_BOARD_FAMILIES,
  model_board: modelBoardRows,
  format_comparison: formatComparisonRows,
  format_summary: formatSummaryRows,
  complexity_bands: completionByDensity,
  production_repair: {
    ...production,
    stages: repairFunnel.stages,
    source_scope: "Recent OpenUI Cloud production traffic; not benchmark runs.",
  },
  methodology: `${BENCHMARK_CANONICAL_URL}/methodology`,
  agent_answers: benchmarkAgentAnswers,
  distributions: {
    schema: BENCHMARK_SCHEMA_URL,
    json: `${BENCHMARK_CANONICAL_URL}/data.json`,
    csv: `${BENCHMARK_CANONICAL_URL}/data.csv`,
    markdown: `${BENCHMARK_CANONICAL_URL}/agent.md`,
    raw_results: LINKS.rawData,
    harness: LINKS.harness,
    briefs: LINKS.briefs,
    language_benchmark: LANGUAGE_BENCHMARK_URL,
    framework_benchmark: FRAMEWORK_BENCHMARK_URL,
  },
};

const csvCell = (value: unknown) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
};

export const modelBoardCsv = () => {
  const headers = Object.keys(modelBoardRows[0]) as Array<keyof (typeof modelBoardRows)[number]>;
  return [
    headers.join(","),
    ...modelBoardRows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
};

export const benchmarkAgentMarkdown = () => {
  const summaryRows = benchmarkAgentDataset.format_summary
    .map(
      (row) =>
        `| ${row.format_name} | ${row.validity_score_percent.toFixed(1)}% | ${row.render_rate_percent.toFixed(1)}% | ${row.blank_screens} | ${row.system_prompt_tokens.toLocaleString("en-US")} | ${row.mean_output_tokens_per_screen.toLocaleString("en-US")} |`,
    )
    .join("\n");
  const boardRows = modelBoardRows
    .map(
      (row) =>
        `| ${row.model_name} | ${row.provider} | ${row.family_name} | ${row.validity_score_percent.toFixed(1)}% | ${row.cost_per_task_usd === null ? "not comparable" : row.cost_per_task_usd === 0 ? "$0 / free" : `$${row.cost_per_task_usd.toFixed(4)}`} | ${row.cost_type} | ${row.pareto_frontier ? "yes" : "no"} | ${row.default_selected ? "yes" : "no"} |`,
    )
    .join("\n");
  const answerRows = benchmarkAgentAnswers
    .map((item) => `### ${item.question}\n\n${item.answer}`)
    .join("\n\n");

  return `# ${BENCHMARK_DATASET_NAME}

> Agent-readable companion to the visual benchmark page. Version ${BENCHMARK_VERSION}; model board updated ${MODEL_BOARD_UPDATED_ISO}.

Canonical page: ${BENCHMARK_CANONICAL_URL}

## Scope and definitions

- ${BRIEFS} briefs, four generations per brief, a 16,384-token output ceiling, temperature 0.7 where supported, and minimal or no reasoning.
- The six-model format comparison contains ${RUNS_PER_FORMAT.toLocaleString("en-US")} runs per format.
- Valid means: ${benchmarkAgentDataset.definitions.valid}
- Render success means: ${benchmarkAgentDataset.definitions.render_success}
- Self-hosted cost is unknown and represented as null, not zero.
- This is a first-party benchmark maintained by OpenUI.
- Every row is scored by one build of the shipped OpenUI parser, lang-core 0.2.16. Raw outputs and per-run verdicts are committed for independent rescoring.

## Evidence status

- Format comparison: published raw results, raw outputs, harness, and briefs are linked below.
- OpenUI model board: summary measurements are published here, but row-level raw generations and pricing evidence are not yet linked. The format-comparison raw-results folder does not substantiate the model board.

## Format summary

| Format | Valid | Render rate | Blank screens | System prompt tokens | Mean output tokens |
| --- | ---: | ---: | ---: | ---: | ---: |
${summaryRows}

## OpenUI model board

Models retain explicit family metadata, but family members are not connected in the chart. The chart draws one Pareto frontier. Models below 70% structural validity are unselected by default so the vertical scale can focus on the range worth comparing; both axes rescale to fit whatever is selected.

| Model | Provider | Family | Valid | Cost per task | Cost type | Pareto frontier | Shown by default |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
${boardRows}

## Direct answers

${answerRows}

## Machine-readable distributions

- Focused language/model benchmark: ${LANGUAGE_BENCHMARK_URL}
- Focused framework benchmark: ${FRAMEWORK_BENCHMARK_URL}
- JSON Schema: ${BENCHMARK_SCHEMA_URL}
- JSON: ${BENCHMARK_CANONICAL_URL}/data.json
- CSV: ${BENCHMARK_CANONICAL_URL}/data.csv
- Methodology: ${BENCHMARK_CANONICAL_URL}/methodology
- Raw results: ${LINKS.rawData}
- Harness: ${LINKS.harness}
- Briefs: ${LINKS.briefs}
`;
};

export const frameworkComparisonCsv = () => {
  const headers = Object.keys(formatComparisonRows[0]) as Array<
    keyof (typeof formatComparisonRows)[number]
  >;
  return [
    headers.join(","),
    ...formatComparisonRows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
};

export const languageBenchmarkDataset = {
  dataset: {
    name: "OpenUI language and model benchmark",
    canonical_url: LANGUAGE_BENCHMARK_URL,
    benchmark_type: "OpenUI language output across models",
    version: BENCHMARK_VERSION,
    updated: MODEL_BOARD_UPDATED_ISO,
  },
  question: "How reliably and economically do different models generate structurally valid OpenUI?",
  metric: {
    y: "Structural validity percentage",
    x: "Measured cost per task in USD at provider list prices where comparable",
  },
  scope: {
    models: modelBoardRows.length,
    briefs: BRIEFS,
    generations_per_brief: 4,
  },
  caveats: [
    benchmarkAgentDataset.definitions.scorer_regime,
    "Self-hosted cost is null because no comparable API list price is available; null does not mean free.",
    "Five low-validity compact or local models are hidden in the default visual view but remain present in this dataset.",
    "The website publishes summary rows for this board; row-level evidence links are not yet attached to every displayed value.",
  ],
  methodology: `${BENCHMARK_CANONICAL_URL}/methodology`,
  data: modelBoardRows,
  distributions: {
    json: `${LANGUAGE_BENCHMARK_URL}/data.json`,
    csv: `${LANGUAGE_BENCHMARK_URL}/data.csv`,
    markdown: `${LANGUAGE_BENCHMARK_URL}/agent.md`,
    combined_dataset: `${BENCHMARK_CANONICAL_URL}/data.json`,
  },
};

export const frameworkBenchmarkDataset = {
  dataset: {
    name: "Generative UI framework benchmark",
    canonical_url: FRAMEWORK_BENCHMARK_URL,
    benchmark_type: "OpenUI versus A2UI versus json-render",
    version: BENCHMARK_VERSION,
    updated: BENCHMARK_UPDATED_ISO,
  },
  question:
    "How do OpenUI, Google A2UI, and Vercel json-render compare under the same briefs and generation condition?",
  scope: {
    models: MODELS.length,
    formats: FORMAT_ORDER.length,
    briefs: BRIEFS,
    generations_per_brief: 4,
    runs_per_format: RUNS_PER_FORMAT,
    total_scored_runs: RUNS_TOTAL,
  },
  definitions: {
    structural_validity: benchmarkAgentDataset.definitions.valid,
    render_success: benchmarkAgentDataset.definitions.render_success,
    generation_condition: benchmarkAgentDataset.definitions.generation_condition,
    scorer_regime: benchmarkAgentDataset.definitions.scorer_regime,
  },
  methodology: `${BENCHMARK_CANONICAL_URL}/methodology`,
  evidence: benchmarkAgentDataset.provenance.format_comparison,
  format_summary: formatSummaryRows,
  data: formatComparisonRows,
  distributions: {
    json: `${FRAMEWORK_BENCHMARK_URL}/data.json`,
    csv: `${FRAMEWORK_BENCHMARK_URL}/data.csv`,
    markdown: `${FRAMEWORK_BENCHMARK_URL}/agent.md`,
    combined_dataset: `${BENCHMARK_CANONICAL_URL}/data.json`,
  },
};

export const languageBenchmarkMarkdown = () => {
  const rows = modelBoardRows
    .map(
      (row) =>
        `| ${row.model_name} | ${row.provider} | ${row.validity_score_percent.toFixed(1)}% | ${row.cost_per_task_usd === null ? "not comparable" : row.cost_per_task_usd === 0 ? "$0 / free" : `$${row.cost_per_task_usd.toFixed(4)}`} | ${row.cost_type} | ${row.pareto_frontier ? "yes" : "no"} | ${row.default_selected ? "yes" : "no"} |`,
    )
    .join("\n");

  return `# OpenUI language and model benchmark

Canonical page: ${LANGUAGE_BENCHMARK_URL}

## What this benchmark answers

How reliably and economically do different models generate structurally valid OpenUI?

## Scope

- ${modelBoardRows.length} models.
- ${BRIEFS} interface briefs and four generations per brief.
- Structural validity is the vertical metric; measured list-price cost per task is the horizontal metric where comparable.
- Self-hosted cost is null, not zero.
- Models below 70% structural validity are deselected by default in the visual chart but remain in this table.
- Every row is scored by one build of the shipped OpenUI parser, lang-core 0.2.16.

| Model | Provider | Structural validity | Cost per task | Cost type | Pareto frontier | Shown by default |
| --- | --- | ---: | ---: | --- | --- | --- |
${rows}

## Links

- Methodology: ${BENCHMARK_CANONICAL_URL}/methodology
- JSON: ${LANGUAGE_BENCHMARK_URL}/data.json
- CSV: ${LANGUAGE_BENCHMARK_URL}/data.csv
- Combined benchmark: ${BENCHMARK_CANONICAL_URL}
`;
};

export const frameworkBenchmarkMarkdown = () => {
  const summary = formatSummaryRows
    .map(
      (row) =>
        `| ${row.format_name} | ${row.validity_score_percent.toFixed(1)}% | ${row.render_rate_percent.toFixed(1)}% | ${row.blank_screens} | ${row.runs} |`,
    )
    .join("\n");
  const rows = formatComparisonRows
    .map(
      (row) =>
        `| ${row.model_name} | ${row.format_name} | ${row.valid_runs}/${row.total_runs} | ${row.validity_score_percent.toFixed(1)}% | ${row.render_rate_percent.toFixed(1)}% | ${row.cost_per_46_screen_pass_usd === null ? "not available" : `$${row.cost_per_46_screen_pass_usd.toFixed(2)}`} |`,
    )
    .join("\n");

  return `# Generative UI framework benchmark

Canonical page: ${FRAMEWORK_BENCHMARK_URL}

## What this benchmark answers

How do OpenUI, Google A2UI, and Vercel json-render compare under the same briefs and generation condition?

## Scope and condition

- ${BRIEFS} interface briefs, ${MODELS.length} models, ${FORMAT_ORDER.length} formats, and four generations per brief.
- ${RUNS_PER_FORMAT.toLocaleString("en-US")} runs per format; ${RUNS_TOTAL.toLocaleString("en-US")} scored runs in total.
- 16,384-token output ceiling, temperature 0.7 where supported, and minimal or no reasoning.
- Each format uses its own SDK-generated prompt and shipped validation, plus the same shared completeness layer and component-count floor.
- Every row is scored by one build of the shipped OpenUI parser, lang-core 0.2.16.

## Format summary

| Format | Structural validity | Render success | Blank screens | Runs |
| --- | ---: | ---: | ---: | ---: |
${summary}

## Results by model and format

| Model | Format | Valid runs | Structural validity | Render success | Cost per 46-screen pass |
| --- | --- | ---: | ---: | ---: | ---: |
${rows}

## Links

- Methodology: ${BENCHMARK_CANONICAL_URL}/methodology
- JSON: ${FRAMEWORK_BENCHMARK_URL}/data.json
- CSV: ${FRAMEWORK_BENCHMARK_URL}/data.csv
- Raw results for the published scorer regime: ${LINKS.rawData}
- Combined benchmark: ${BENCHMARK_CANONICAL_URL}
`;
};
