const baseUrl = process.env.BENCHMARK_BASE_URL ?? "http://localhost:3067";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const fetchText = async (path) => {
  const response = await fetch(`${baseUrl}${path}`);
  assert(response.ok, `${path} returned ${response.status}`);
  return { response, text: await response.text() };
};

const parseCsv = (source) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted && character === '"' && source[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (character === "\n" && !quoted) {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const [headers, ...values] = rows.filter((item) => item.some(Boolean));
  return values.map((item) =>
    Object.fromEntries(headers.map((header, index) => [header, item[index]])),
  );
};

const { response: jsonResponse, text: jsonText } = await fetchText("/benchmarks/data.json");
const data = JSON.parse(jsonText);
const { response: schemaResponse, text: schemaText } = await fetchText(
  "/benchmarks/data.schema.json",
);
const schema = JSON.parse(schemaText);
const { text: csvText } = await fetchText("/benchmarks/data.csv");
const { text: markdown } = await fetchText("/benchmarks/agent.md");
const { text: html } = await fetchText("/benchmarks");
const { text: languageJsonText } = await fetchText("/benchmarks/language/data.json");
const { text: frameworkJsonText } = await fetchText("/benchmarks/framework/data.json");
const languageData = JSON.parse(languageJsonText);
const frameworkData = JSON.parse(frameworkJsonText);

assert(
  schemaResponse.headers.get("content-type")?.includes("application/schema+json"),
  "Schema has the wrong content type",
);
assert(data.$schema === schema.$id, "Dataset $schema and schema $id do not match");
assert(
  jsonResponse.headers.get("link")?.includes('rel="describedby"'),
  "Dataset response does not advertise its schema",
);
assert(
  schema.required.every((key) => key in data),
  "Dataset is missing a schema-required root key",
);
assert(html.includes("/benchmarks/data.schema.json"), "HTML does not advertise the JSON Schema");
assert(
  data.provenance.model_board.evidence_status === "summary-only",
  "Model-board evidence status must remain explicit until raw evidence is published",
);
assert(
  JSON.stringify(languageData.data) === JSON.stringify(data.model_board),
  "Focused language dataset differs from the combined model board",
);
assert(
  JSON.stringify(frameworkData.data) === JSON.stringify(data.format_comparison),
  "Focused framework dataset differs from the combined format comparison",
);
assert(
  JSON.stringify(frameworkData.format_summary) === JSON.stringify(data.format_summary),
  "Focused framework summary differs from the combined format summary",
);

const csvRows = parseCsv(csvText);
assert(csvRows.length === data.model_board.length, "CSV and JSON model counts differ");
const csvById = new Map(csvRows.map((row) => [row.model_id, row]));
for (const model of data.model_board) {
  const csvRow = csvById.get(model.model_id);
  assert(csvRow, `CSV is missing ${model.model_id}`);
  assert(csvRow.model_name === model.model_name, `${model.model_id} name differs in CSV`);
  assert(csvRow.provider === model.provider, `${model.model_id} provider differs in CSV`);
  assert(
    Number(csvRow.validity_score_percent) === model.validity_score_percent,
    `${model.model_id} validity differs in CSV`,
  );
  assert(
    (csvRow.cost_per_task_usd === "" ? null : Number(csvRow.cost_per_task_usd)) ===
      model.cost_per_task_usd,
    `${model.model_id} task cost differs in CSV`,
  );
  assert(markdown.includes(`| ${model.model_name} |`), `Markdown is missing ${model.model_name}`);
}

const answerById = new Map(data.agent_answers.map((item) => [item.id, item]));
const answer = (id) => {
  const item = answerById.get(id);
  assert(item, `Missing agent answer: ${id}`);
  assert(
    markdown.includes(`### ${item.question}`),
    `Markdown is missing question: ${item.question}`,
  );
  assert(markdown.includes(item.answer), `Markdown answer differs for: ${item.question}`);
  return item.answer;
};

const openui = data.format_summary.find((row) => row.format_id === "openui");
const bestScore = Math.max(...data.model_board.map((row) => row.validity_score_percent));
const bestModels = data.model_board.filter((row) => row.validity_score_percent === bestScore);
const cheapestPrompt = [...data.format_summary].sort(
  (left, right) => left.system_prompt_tokens - right.system_prompt_tokens,
)[0];

const contracts = [
  [
    "scope includes brief count",
    () => answer("benchmark-scope").includes(`${data.scope.briefs} interface briefs`),
  ],
  [
    "scope includes format count",
    () => answer("benchmark-scope").includes(`${data.scope.formats} formats`),
  ],
  [
    "scope includes comparison-model count",
    () => answer("benchmark-scope").includes(`${data.scope.comparison_models} models`),
  ],
  [
    "scope includes model-board count",
    () => answer("benchmark-scope").includes(`${data.scope.model_board_models} models`),
  ],
  [
    "scope includes total run count",
    () => answer("benchmark-scope").includes(data.scope.total_scored_runs.toLocaleString("en-US")),
  ],
  [
    "validity answer states parsing requirement",
    () => answer("valid-definition").includes("must parse"),
  ],
  [
    "validity answer states reference requirement",
    () => answer("valid-definition").includes("resolve every reference"),
  ],
  [
    "best-score answer contains every tied model",
    () => bestModels.every((row) => answer("highest-model-validity").includes(row.model_name)),
  ],
  [
    "best-score answer contains measured score",
    () => answer("highest-model-validity").includes(`${bestScore.toFixed(1)}%`),
  ],
  [
    "OpenUI answer contains validity",
    () => answer("openui-format-result").includes(`${openui.validity_score_percent.toFixed(1)}%`),
  ],
  [
    "OpenUI answer contains render rate",
    () => answer("openui-format-result").includes(`${openui.render_rate_percent.toFixed(1)}%`),
  ],
  [
    "OpenUI answer contains blank-screen count",
    () => answer("openui-format-result").includes(`${openui.blank_screens} blank screen`),
  ],
  [
    "prompt answer identifies the minimum",
    () => answer("prompt-token-result").includes(`${cheapestPrompt.format_name} used the fewest`),
  ],
  [
    "self-hosted rows use null cost",
    () =>
      data.model_board
        .filter((row) => row.cost_type === "self-hosted")
        .every((row) => row.cost_per_task_usd === null),
  ],
  [
    "numeric zero is restricted to free rows",
    () =>
      data.model_board
        .filter((row) => row.cost_per_task_usd === 0)
        .every((row) => row.cost_type === "free"),
  ],
  [
    "cost answer distinguishes null from zero",
    () =>
      answer("self-hosted-cost").includes("cost is null") &&
      answer("self-hosted-cost").includes("numeric zero"),
  ],
  [
    "Pareto answer rejects general ranking",
    () => answer("pareto-meaning").includes("not a general model ranking"),
  ],
  [
    "family membership references valid models",
    () =>
      data.model_families
        .flatMap((family) => family.models)
        .every((id) => data.model_board.some((row) => row.model_id === id)),
  ],
  [
    "tab answer names both views",
    () =>
      answer("chart-views").includes("Model comparison") &&
      answer("chart-views").includes("Format comparison"),
  ],
  [
    "tab answer names every compared format",
    () => ["OpenUI", "A2UI", "json-render"].every((name) => answer("chart-views").includes(name)),
  ],
  [
    "tab answer explains the dynamic validity scale",
    () => answer("chart-views").includes("70%") && answer("chart-views").includes("rescale"),
  ],
  [
    "the default filter matches the published 70% threshold",
    () =>
      data.model_board.every((row) => row.default_selected === row.validity_score_percent >= 70) &&
      data.model_board.some((row) => !row.default_selected),
  ],
];

for (const [name, check] of contracts) assert(check(), `Answer contract failed: ${name}`);

console.log(`Benchmark answer contracts passed (${contracts.length}/${contracts.length}).`);
