/**
 * generative-ui-bench — single source of truth for every number on the
 * benchmark blog post.
 *
 * Rules for this file:
 *  - Charts read from here. Never hardcode a number in a chart component.
 *  - Every value is computed from the committed results files in the
 *    generative-ui-bench repo (results-<model>-{native,official}.json),
 *    never typed from prose.
 */

export type FormatId = "openui" | "a2ui" | "jsonRender";

export const FORMATS = [
  { id: "openui", label: "OpenUI", vendor: "Thesys", series: 1, mark: "openui" },
  { id: "a2ui", label: "A2UI", vendor: "Google", series: 2, mark: "google" },
  { id: "jsonRender", label: "json-render", vendor: "Vercel", series: 3, mark: "vercel" },
] as const satisfies ReadonlyArray<{
  id: FormatId;
  label: string;
  vendor: string;
  series: 1 | 2 | 3;
  mark?: string;
}>;

export const FORMAT_ORDER: FormatId[] = ["openui", "a2ui", "jsonRender"];

export const formatLabel = (id: FormatId) => FORMATS.find((f) => f.id === id)!.label;

/* ------------------------------------------------------------------ */
/* Run accounting — every other n on the page derives from this        */
/* ------------------------------------------------------------------ */

export const BRIEFS = 46;
export const CATALOG_COMPONENTS = 70;

/** One uniform condition: every model ran every brief 4 times per format. */
export const MODELS = [
  { id: "sol", mark: "openai", label: "Sol", family: "GPT-5.6", vendor: "OpenAI", gensPerBrief: 4 },
  { id: "opus", mark: "anthropic", label: "Claude Opus 4.8", vendor: "Anthropic", gensPerBrief: 4 },
  { id: "kimi", mark: "moonshot", label: "Kimi K3", vendor: "Moonshot", gensPerBrief: 4 },
  { id: "gemini", mark: "gemini", label: "Gemini 3.7 Flash", vendor: "Google", gensPerBrief: 4 },
  { id: "qwen", mark: "qwen", label: "Qwen3.8 2.4T", vendor: "Alibaba", gensPerBrief: 4 },
  { id: "muse", mark: "meta", label: "Muse Spark 1.2", vendor: "Meta", gensPerBrief: 4 },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

/** Runs per model per format: 184. */
export const runsFor = (modelId: ModelId) =>
  BRIEFS * MODELS.find((m) => m.id === modelId)!.gensPerBrief;

/** 1,104 — the denominator under every whole-benchmark count. */
export const RUNS_PER_FORMAT = MODELS.reduce((n, m) => n + BRIEFS * m.gensPerBrief, 0);
export const RUNS_TOTAL = RUNS_PER_FORMAT * FORMATS.length;

/* ------------------------------------------------------------------ */
/* 1. Completion by model                                              */
/* ------------------------------------------------------------------ */

/**
 * Scored-run counts, transcribed from results/results-<model>.json — the only
 * hand-copied numbers in this file, and the ones `score.mjs` regenerates.
 * Every completion and blank-screen figure on the site divides two of these.
 *
 * `renderable` is each SDK's own shipped renderer: A2UI drops a whole
 * updateComponents message on any invalid component, so its renderable counts
 * are its all-or-nothing rule in action. See `blankScreens` for the
 * conservative counterfactual reading.
 */
export type RunCount = { runs: number; complete: number; renderable: number };

export const runCounts: Record<ModelId, Record<FormatId, RunCount>> = {
  sol: {
    openui: { runs: 184, complete: 183, renderable: 184 },
    a2ui: { runs: 184, complete: 177, renderable: 179 },
    jsonRender: { runs: 184, complete: 152, renderable: 184 },
  },
  opus: {
    openui: { runs: 184, complete: 182, renderable: 184 },
    a2ui: { runs: 184, complete: 183, renderable: 184 },
    jsonRender: { runs: 184, complete: 161, renderable: 184 },
  },
  kimi: {
    openui: { runs: 184, complete: 177, renderable: 184 },
    a2ui: { runs: 184, complete: 176, renderable: 179 },
    jsonRender: { runs: 184, complete: 131, renderable: 184 },
  },
  gemini: {
    openui: { runs: 184, complete: 182, renderable: 184 },
    a2ui: { runs: 184, complete: 173, renderable: 178 },
    jsonRender: { runs: 184, complete: 171, renderable: 184 },
  },
  qwen: {
    openui: { runs: 184, complete: 169, renderable: 183 },
    a2ui: { runs: 184, complete: 168, renderable: 168 },
    jsonRender: { runs: 184, complete: 149, renderable: 180 },
  },
  muse: {
    openui: { runs: 184, complete: 177, renderable: 184 },
    a2ui: { runs: 184, complete: 178, renderable: 179 },
    jsonRender: { runs: 184, complete: 150, renderable: 184 },
  },
};

/** % of 184 runs where everything asked for renders and every reference resolves. */
export const completionByModel: Record<ModelId, Record<FormatId, number>> = Object.fromEntries(
  MODELS.map((m) => [
    m.id,
    Object.fromEntries(
      FORMAT_ORDER.map((f) => [f, (runCounts[m.id][f].complete / runCounts[m.id][f].runs) * 100]),
    ),
  ]),
) as Record<ModelId, Record<FormatId, number>>;

/**
 * Pooled completion over any subset of models — the number the page's model
 * filter reads. Pooling counts (rather than averaging rates) keeps a filtered
 * view exact instead of an average of rounded averages; with the uniform
 * 4-generation condition the two agree on the full set anyway.
 */
export const completionOver = (
  id: FormatId,
  models: readonly ModelId[] = MODELS.map((m) => m.id),
) => {
  const t = models.reduce(
    (acc, m) => ({ c: acc.c + runCounts[m][id].complete, n: acc.n + runCounts[m][id].runs }),
    { c: 0, n: 0 },
  );
  return t.n ? (t.c / t.n) * 100 : Number.NaN;
};

/** Runs behind a filtered completion figure — the n printed under the chart. */
export const runsOver = (models: readonly ModelId[] = MODELS.map((m) => m.id)) =>
  models.reduce((n, m) => n + runsFor(m), 0);

/**
 * Unweighted mean of the six per-model rates — each model gets equal weight.
 * With the uniform 4-rep condition this equals the pooled rate. Computed,
 * never typed. Note: the openui mean sits on a rounding boundary (92.9499...);
 * any change to a per-model rate can flip the displayed 92.9, so re-sync the
 * prose if these values ever move.
 */
export const completionMean = (id: FormatId) =>
  MODELS.reduce((sum, m) => sum + completionByModel[m.id][id], 0) / MODELS.length;

export const winnerFor = (modelId: ModelId): FormatId =>
  FORMAT_ORDER.reduce((best, id) =>
    completionByModel[modelId][id] > completionByModel[modelId][best] ? id : best,
  );

/** Models where each format takes the top score. Qwen is an exact tie
 *  (89.7 OpenUI and A2UI); winnerFor resolves it to the first in FORMAT_ORDER. */
export const modelWins = (id: FormatId) =>
  MODELS.filter((m) => winnerFor(m.id) === id).map((m) => m.label);

/* ------------------------------------------------------------------ */
/* 2. Blank screens                                                    */
/* ------------------------------------------------------------------ */

/**
 * Runs where the user saw nothing at all, out of RUNS_PER_FORMAT — each SDK's
 * own shipped renderer, derived from the `renderable` counts above. A2UI drops
 * a whole updateComponents message on any invalid component, so its total is
 * that all-or-nothing rule in action rather than a harsher scoring choice.
 */
export const blankScreens: Record<FormatId, number> = Object.fromEntries(
  FORMAT_ORDER.map((f) => [
    f,
    MODELS.reduce((n, m) => n + (runCounts[m.id][f].runs - runCounts[m.id][f].renderable), 0),
  ]),
) as Record<FormatId, number>;

/** The single OpenUI blank is an empty API response from Qwen; the same brief
 *  comes back at full length on the other five models. */
export const openuiBlankCause = { models: ["qwen"] as ModelId[], reason: "empty response" };

/** The same reading, over any subset of models. */
export const blanksOver = (id: FormatId, models: readonly ModelId[] = MODELS.map((m) => m.id)) =>
  models.reduce((n, m) => n + (runCounts[m][id].runs - runCounts[m][id].renderable), 0);

/* ------------------------------------------------------------------ */
/* 3. Completion by screen density                                     */
/* ------------------------------------------------------------------ */

/**
 * The five size bands, as designed in briefs/DESIGN.md. `requirements` is the
 * inclusive span of numbered requirements a brief in that band carries; the
 * bands are uneven (10/10/10/8/8 briefs) because the design fixed the sizes
 * first and the brief count second.
 */
export const densityBands = [
  { id: "b1", band: "2–3", requirements: [2, 3], briefs: 10 },
  { id: "b2", band: "4–6", requirements: [4, 6], briefs: 10 },
  { id: "b3", band: "7–9", requirements: [7, 9], briefs: 10 },
  { id: "b4", band: "11–13", requirements: [11, 13], briefs: 8 },
  { id: "b5", band: "16–18", requirements: [16, 18], briefs: 8 },
] as const satisfies ReadonlyArray<{
  id: string;
  band: string;
  requirements: readonly [number, number];
  briefs: number;
}>;

export type BandId = (typeof densityBands)[number]["id"];

/**
 * Per-band scored-run counts, recomputed from the results files by joining
 * every run to its brief's `reqs` in briefs/briefs.mjs. Earlier versions of
 * this table were recovered from an old chart's geometry; these are counts.
 */
export const densityCounts: Record<ModelId, Record<BandId, Record<FormatId, RunCount>>> = {
  sol: {
    b1: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 40, renderable: 40 },
      jsonRender: { runs: 40, complete: 35, renderable: 40 },
    },
    b2: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 39, renderable: 40 },
      jsonRender: { runs: 40, complete: 35, renderable: 40 },
    },
    b3: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 37, renderable: 37 },
      jsonRender: { runs: 40, complete: 34, renderable: 40 },
    },
    b4: {
      openui: { runs: 32, complete: 31, renderable: 32 },
      a2ui: { runs: 32, complete: 30, renderable: 31 },
      jsonRender: { runs: 32, complete: 25, renderable: 32 },
    },
    b5: {
      openui: { runs: 32, complete: 32, renderable: 32 },
      a2ui: { runs: 32, complete: 31, renderable: 31 },
      jsonRender: { runs: 32, complete: 23, renderable: 32 },
    },
  },
  opus: {
    b1: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 40, renderable: 40 },
      jsonRender: { runs: 40, complete: 36, renderable: 40 },
    },
    b2: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 40, renderable: 40 },
      jsonRender: { runs: 40, complete: 36, renderable: 40 },
    },
    b3: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 40, renderable: 40 },
      jsonRender: { runs: 40, complete: 37, renderable: 40 },
    },
    b4: {
      openui: { runs: 32, complete: 32, renderable: 32 },
      a2ui: { runs: 32, complete: 31, renderable: 32 },
      jsonRender: { runs: 32, complete: 25, renderable: 32 },
    },
    b5: {
      openui: { runs: 32, complete: 30, renderable: 32 },
      a2ui: { runs: 32, complete: 32, renderable: 32 },
      jsonRender: { runs: 32, complete: 27, renderable: 32 },
    },
  },
  kimi: {
    b1: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 40, renderable: 40 },
      jsonRender: { runs: 40, complete: 34, renderable: 40 },
    },
    b2: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 40, renderable: 40 },
      jsonRender: { runs: 40, complete: 27, renderable: 40 },
    },
    b3: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 38, renderable: 39 },
      jsonRender: { runs: 40, complete: 33, renderable: 40 },
    },
    b4: {
      openui: { runs: 32, complete: 28, renderable: 32 },
      a2ui: { runs: 32, complete: 29, renderable: 30 },
      jsonRender: { runs: 32, complete: 15, renderable: 32 },
    },
    b5: {
      openui: { runs: 32, complete: 30, renderable: 32 },
      a2ui: { runs: 32, complete: 29, renderable: 30 },
      jsonRender: { runs: 32, complete: 22, renderable: 32 },
    },
  },
  gemini: {
    b1: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 40, renderable: 40 },
      jsonRender: { runs: 40, complete: 36, renderable: 40 },
    },
    b2: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 40, renderable: 40 },
      jsonRender: { runs: 40, complete: 30, renderable: 40 },
    },
    b3: {
      openui: { runs: 40, complete: 39, renderable: 40 },
      a2ui: { runs: 40, complete: 39, renderable: 40 },
      jsonRender: { runs: 40, complete: 34, renderable: 40 },
    },
    b4: {
      openui: { runs: 32, complete: 27, renderable: 32 },
      a2ui: { runs: 32, complete: 28, renderable: 30 },
      jsonRender: { runs: 32, complete: 20, renderable: 32 },
    },
    b5: {
      openui: { runs: 32, complete: 29, renderable: 32 },
      a2ui: { runs: 32, complete: 28, renderable: 30 },
      jsonRender: { runs: 32, complete: 22, renderable: 32 },
    },
  },
  qwen: {
    b1: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 40, renderable: 40 },
      jsonRender: { runs: 40, complete: 36, renderable: 40 },
    },
    b2: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 39, renderable: 39 },
      jsonRender: { runs: 40, complete: 33, renderable: 40 },
    },
    b3: {
      openui: { runs: 40, complete: 38, renderable: 40 },
      a2ui: { runs: 40, complete: 34, renderable: 34 },
      jsonRender: { runs: 40, complete: 31, renderable: 40 },
    },
    b4: {
      openui: { runs: 32, complete: 28, renderable: 32 },
      a2ui: { runs: 32, complete: 28, renderable: 28 },
      jsonRender: { runs: 32, complete: 24, renderable: 30 },
    },
    b5: {
      openui: { runs: 32, complete: 23, renderable: 31 },
      a2ui: { runs: 32, complete: 27, renderable: 27 },
      jsonRender: { runs: 32, complete: 25, renderable: 30 },
    },
  },
  muse: {
    b1: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 39, renderable: 39 },
      jsonRender: { runs: 40, complete: 38, renderable: 40 },
    },
    b2: {
      openui: { runs: 40, complete: 39, renderable: 40 },
      a2ui: { runs: 40, complete: 39, renderable: 39 },
      jsonRender: { runs: 40, complete: 35, renderable: 40 },
    },
    b3: {
      openui: { runs: 40, complete: 40, renderable: 40 },
      a2ui: { runs: 40, complete: 38, renderable: 38 },
      jsonRender: { runs: 40, complete: 36, renderable: 40 },
    },
    b4: {
      openui: { runs: 32, complete: 29, renderable: 32 },
      a2ui: { runs: 32, complete: 30, renderable: 31 },
      jsonRender: { runs: 32, complete: 22, renderable: 32 },
    },
    b5: {
      openui: { runs: 32, complete: 30, renderable: 32 },
      a2ui: { runs: 32, complete: 32, renderable: 32 },
      jsonRender: { runs: 32, complete: 19, renderable: 32 },
    },
  },
};

/** Pooled completion inside one band over any subset of models. */
export const densityRate = (
  band: BandId,
  id: FormatId,
  models: readonly ModelId[] = MODELS.map((m) => m.id),
) => {
  const t = models.reduce(
    (acc, m) => ({
      c: acc.c + densityCounts[m][band][id].complete,
      n: acc.n + densityCounts[m][band][id].runs,
    }),
    { c: 0, n: 0 },
  );
  return t.n ? (t.c / t.n) * 100 : Number.NaN;
};

/** Runs per format inside one band, for the subset — the n under the chart. */
export const densityRuns = (band: BandId, models: readonly ModelId[] = MODELS.map((m) => m.id)) =>
  models.reduce((n, m) => n + densityCounts[m][band].openui.runs, 0);

/**
 * Completion per band for a subset of models, in band order. Defaults to all
 * six, which reproduces the table published with the blog post.
 */
export const completionByDensityFor = (
  models: readonly ModelId[] = MODELS.map((m) => m.id),
): Array<{ band: string; id: BandId; briefs: number; runs: number } & Record<FormatId, number>> =>
  densityBands.map((b) => ({
    id: b.id,
    band: b.band,
    briefs: b.briefs,
    runs: densityRuns(b.id, models),
    ...(Object.fromEntries(FORMAT_ORDER.map((f) => [f, densityRate(b.id, f, models)])) as Record<
      FormatId,
      number
    >),
  }));

export const completionByDensity = completionByDensityFor();

/* ------------------------------------------------------------------ */
/* 4. Tokens                                                           */
/* ------------------------------------------------------------------ */

/** tiktoken o200k on the exact prompts and outputs. */
export const tokens = {
  /** Generated by each SDK's own generator over the same 70-component catalog.
   *  The OpenUI prompt includes its component groups, two worked examples and
   *  three rules, all passed through generatePrompt's official options. */
  systemPrompt: { openui: 5_031, a2ui: 12_610, jsonRender: 7_651 } as Record<FormatId, number>,
  /** Mean output per screen over all 1,104 scored runs (six models). */
  outputPerScreen: { openui: 1_362, a2ui: 2_823, jsonRender: 3_258 } as Record<FormatId, number>,
  outputBasis: { runs: 1_104 },
};

export const timesBaseline = (value: number, baseline: number) => value / baseline;

/* ------------------------------------------------------------------ */
/* 5. Cost                                                             */
/* ------------------------------------------------------------------ */

/** USD for one benchmark pass = 46 screens, at provider list prices. All six models. */
export const COST_MODELS: ModelId[] = ["gemini", "muse", "qwen", "kimi", "opus", "sol"];

export const costPerPass: Partial<Record<ModelId, Record<FormatId, number>>> = {
  gemini: { openui: 0.42, a2ui: 0.95, jsonRender: 0.85 },
  muse: { openui: 0.71, a2ui: 1.38, jsonRender: 1.34 },
  qwen: { openui: 0.81, a2ui: 1.9, jsonRender: 1.46 },
  kimi: { openui: 1.53, a2ui: 3.16, jsonRender: 2.91 },
  opus: { openui: 2.27, a2ui: 5.85, jsonRender: 4.88 },
  sol: { openui: 3.08, a2ui: 6.84, jsonRender: 6.3 },
};

/** The procurement unit: dollars per 1,000 screens. */
export const costPer1kScreens = (modelId: ModelId, id: FormatId) =>
  (costPerPass[modelId]![id] / BRIEFS) * 1000;

/* ------------------------------------------------------------------ */
/* OpenUI model board — the expanded, OpenUI-only provider comparison  */
/* ------------------------------------------------------------------ */

/**
 * API-model results from the 24–25 Aug 2026 OpenUI model-board run.
 * Every row used the same 46 briefs, four generations per brief, frozen
 * OpenUI prompt and validator. Cost is the measured price of one 46-screen
 * pass; charts divide by BRIEFS so the horizontal axis stays cost per task.
 *
 * The two self-hosted starting-line models are intentionally absent because
 * the source run reports serving hardware rather than a comparable API cost.
 */
export const OPENUI_MODEL_BOARD = [
  {
    id: "grok-4-6",
    label: "Grok 4.6",
    provider: "xAI",
    score: 99.5,
    costPerPass: 0.85,
  },
  {
    id: "gpt-5-6-sol",
    label: "GPT-5.6 Sol",
    provider: "OpenAI",
    score: 99.5,
    costPerPass: 2.19,
  },
  {
    id: "claude-opus-4-8",
    label: "Claude Opus 4.8",
    provider: "Anthropic",
    score: 98.9,
    costPerPass: 2.27,
  },
  {
    id: "gemini-3-7-flash",
    label: "Gemini 3.7 Flash",
    provider: "Google",
    score: 98.9,
    costPerPass: 0.46,
  },
  {
    id: "claude-sonnet-5",
    label: "Claude Sonnet 5",
    provider: "Anthropic",
    score: 98.4,
    costPerPass: 0.93,
  },
  {
    id: "gpt-5-6-terra",
    label: "GPT-5.6 Terra",
    provider: "OpenAI",
    score: 98.4,
    costPerPass: 1.11,
  },
  {
    id: "kimi-k3",
    label: "Kimi K3",
    provider: "Moonshot",
    score: 96.2,
    costPerPass: 1.53,
  },
  {
    id: "claude-opus-5",
    label: "Claude Opus 5",
    provider: "Anthropic",
    score: 96.2,
    costPerPass: 3.56,
  },
  {
    id: "muse-spark-1-2",
    label: "Muse Spark 1.2",
    provider: "Meta",
    score: 96.2,
    costPerPass: 0.72,
  },
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    provider: "Anthropic",
    score: 92.9,
    costPerPass: 2.07,
  },
  {
    id: "qwen-3-8-2-4t",
    label: "Qwen3.8 2.4T",
    provider: "Alibaba",
    score: 91.8,
    costPerPass: 0.78,
  },
  {
    id: "glm-5-3",
    label: "GLM-5.3",
    provider: "Zhipu",
    score: 90.8,
    costPerPass: 0.55,
  },
  {
    id: "inkling-small",
    label: "Inkling Small",
    provider: "Thinking Machines",
    score: 88.6,
    costPerPass: 0.15,
  },
  {
    id: "deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    provider: "DeepSeek",
    score: 85.8,
    costPerPass: 0.02,
  },
  {
    id: "deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    provider: "DeepSeek",
    score: 84.2,
    costPerPass: 0.41,
  },
  {
    id: "gpt-5-6-luna",
    label: "GPT-5.6 Luna",
    provider: "OpenAI",
    score: 83.7,
    costPerPass: 0.1,
  },
  {
    id: "qwen-3-8-27b",
    label: "Qwen3.8 27B",
    provider: "Alibaba",
    score: 78.8,
    costPerPass: 0.25,
  },
  {
    id: "gemini-3-6-flash",
    label: "Gemini 3.6 Flash",
    provider: "Google",
    score: 78.8,
    costPerPass: 0.42,
  },
  {
    id: "gemini-3-5-flash-lite",
    label: "Gemini 3.5 Flash-Lite",
    provider: "Google",
    score: 78.3,
    costPerPass: 0.19,
  },
  {
    id: "inkling",
    label: "Inkling",
    provider: "Thinking Machines",
    score: 73.4,
    costPerPass: 0.37,
  },
  {
    id: "oui-1",
    label: "OUI-1 (DiffusionGemma 26B-A4B, finetuned)",
    provider: "Thesys",
    score: 71.7,
    costPerPass: 0,
    unpriced: true,
    serving: "Self-hosted · A100 FP8",
  },
  {
    id: "qwen-3-6-27b",
    label: "Qwen3.6 27B",
    provider: "Alibaba",
    score: 68.5,
    costPerPass: 0.29,
  },
  {
    id: "qwen-3-6-35b-a3b",
    label: "Qwen3.6 35B-A3B",
    provider: "Alibaba",
    score: 61.4,
    costPerPass: 0.08,
  },
  {
    id: "gemma-4-31b",
    label: "Gemma 4 31B",
    provider: "Google",
    score: 46.7,
    costPerPass: 0.04,
  },
  {
    id: "phi-4",
    label: "Phi-4",
    provider: "Microsoft",
    score: 44.0,
    costPerPass: 0.02,
  },
  {
    id: "gemma-4-26b-a4b",
    label: "Gemma 4 26B-A4B",
    provider: "Google",
    score: 29.9,
    costPerPass: 0.03,
  },
  {
    id: "ministral-8b",
    label: "Ministral 8B",
    provider: "Mistral",
    score: 27.2,
    costPerPass: 0.04,
  },
  {
    id: "granite-4-1-8b",
    label: "Granite 4.1 8B",
    provider: "IBM",
    score: 14.7,
    costPerPass: 0.01,
  },
  {
    id: "lfm-2-5-2-6b",
    label: "LFM 2.5 2.6B",
    provider: "Liquid",
    score: 3.3,
    costPerPass: 0.0,
  },
  {
    id: "diffusion-gemma-26b-a4b",
    label: "DiffusionGemma 26B-A4B",
    provider: "Google",
    score: 13.0,
    costPerPass: 0,
    unpriced: true,
    serving: "Self-hosted · A100 FP8",
  },
  {
    id: "ling-3-tiny",
    label: "Ling 3.0 Tiny",
    provider: "InclusionAI",
    score: 9.8,
    costPerPass: 0,
    unpriced: true,
    serving: "Self-hosted · llama.cpp Q8",
  },
] as const;

/**
 * A model has to clear this structural-validity score to be selected in the
 * chart's opening view. Below it, a model is not a candidate anyone is
 * choosing between, and plotting it stretches the axis over empty space.
 * A threshold rather than a hand-kept list, so the default follows the data
 * whenever scores are regenerated. Every model stays in the table, the
 * downloads and the filter, and selecting one expands the axis to fit it.
 */
export const MODEL_BOARD_DEFAULT_MIN_SCORE = 70;

export const MODEL_BOARD_DEFAULT_HIDDEN_IDS = OPENUI_MODEL_BOARD.filter(
  (point) => point.score < MODEL_BOARD_DEFAULT_MIN_SCORE,
).map((point) => point.id);

export const modelBoardDefaultSelected = (modelId: string) => {
  const point = OPENUI_MODEL_BOARD.find((entry) => entry.id === modelId);
  return point ? point.score >= MODEL_BOARD_DEFAULT_MIN_SCORE : true;
};

/** How many models the board carries. Derived so copy cannot drift from data. */
export const MODEL_BOARD_SIZE = OPENUI_MODEL_BOARD.length;

export type ModelBoardPoint = (typeof OPENUI_MODEL_BOARD)[number];
export type ModelBoardProvider = ModelBoardPoint["provider"];
export const modelBoardCostPerTask = (point: ModelBoardPoint) => point.costPerPass / BRIEFS;

/**
 * Explicit family membership for the model-board lines. Keeping this beside
 * the measurements makes the relationship available to tables, data exports
 * and agents instead of leaving it encoded only in SVG geometry.
 */
export const MODEL_BOARD_FAMILIES = [
  {
    id: "gpt-5-6",
    label: "GPT-5.6",
    provider: "OpenAI",
    models: ["gpt-5-6-sol", "gpt-5-6-terra", "gpt-5-6-luna"],
  },
  {
    id: "claude",
    label: "Claude",
    provider: "Anthropic",
    models: ["claude-opus-5", "claude-opus-4-8", "claude-sonnet-5", "claude-sonnet-4-6"],
  },
  {
    id: "gemini-flash",
    label: "Gemini Flash",
    provider: "Google",
    models: ["gemini-3-7-flash", "gemini-3-6-flash", "gemini-3-5-flash-lite"],
  },
  {
    id: "gemma-4",
    label: "Gemma 4",
    provider: "Google",
    models: ["gemma-4-31b", "gemma-4-26b-a4b"],
  },
  {
    id: "qwen-3-8",
    label: "Qwen3.8",
    provider: "Alibaba",
    models: ["qwen-3-8-2-4t", "qwen-3-8-27b"],
  },
  {
    id: "qwen-3-6",
    label: "Qwen3.6",
    provider: "Alibaba",
    models: ["qwen-3-6-27b", "qwen-3-6-35b-a3b"],
  },
  {
    id: "deepseek-v4",
    label: "DeepSeek V4",
    provider: "DeepSeek",
    models: ["deepseek-v4-pro", "deepseek-v4-flash"],
  },
  {
    id: "inkling",
    label: "Inkling",
    provider: "Thinking Machines",
    models: ["inkling", "inkling-small"],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  provider: ModelBoardProvider;
  models: readonly string[];
}>;

export const modelBoardFamilyFor = (modelId: string) =>
  MODEL_BOARD_FAMILIES.find((family) => family.models.includes(modelId as never));

export const modelBoardFrontier = () =>
  OPENUI_MODEL_BOARD.filter(
    (point) =>
      !("unpriced" in point) &&
      !OPENUI_MODEL_BOARD.some(
        (other) =>
          other !== point &&
          !("unpriced" in other) &&
          modelBoardCostPerTask(other) <= modelBoardCostPerTask(point) &&
          other.score >= point.score &&
          (modelBoardCostPerTask(other) < modelBoardCostPerTask(point) ||
            other.score > point.score),
      ),
  ).sort((a, b) => modelBoardCostPerTask(b) - modelBoardCostPerTask(a));

/* ------------------------------------------------------------------ */
/* 6. Production: failure taxonomy + repair                            */
/* ------------------------------------------------------------------ */

/** Share of production failures by family, from a 15-day OpenUI Cloud parser
 *  log of 1,285 failed generations. */
export const failureTaxonomy = [
  { family: "No valid root (often truncation-related)", share: 44 },
  { family: "Reference graph (dangling or orphaned refs)", share: 36 },
  { family: "Enum, type and argument errors", share: 16 },
  { family: "Truncation", share: 4 },
];

/** A recent week of OpenUI Cloud streaming traffic. The upstream record is a
 *  set of rates, not a count of individual generations, so everything derived
 *  from it stays a rate. Same source as the numbers in the blog post. */
export const production = {
  /** % of streaming generations that trip validation on the first pass. */
  triggerRate: 7,
  /** % of those first-pass failures the sanitizer recovers. */
  repairedShare: 88,
  /** % of all streaming requests that reach a user broken. */
  userVisibleShare: 0.9,
};

/**
 * The repair funnel exactly as the blog post describes it, read as shares of
 * ALL streaming generations rather than of the failures alone — the earlier
 * failure-based framing read as though 12% of screens showed an error.
 *
 * Three layers, in the order traffic meets them: the parser absorbs cosmetic
 * breakage before validation (no model call), validation catches the genuine
 * structural errors, and a small sanitizer model repairs most of those.
 */
export const repairFunnel = {
  stages: [
    {
      id: "all",
      label: "All generations",
      share: 100,
      fix: "Parser fixes syntax issues first",
      llm: false,
    },
    {
      id: "failed",
      label: "Fail validation",
      share: production.triggerRate,
      fix: "Structural issues like dangling refs and bad enums",
      llm: false,
    },
    {
      id: "broken",
      label: "Reach a user broken",
      share: production.userVisibleShare,
      fix: `${production.repairedShare}% are repaired via incremental editing`,
      llm: true,
    },
  ],
};

export const repairedShare = () => production.repairedShare;

/** Compound: a screen fails validation AND survives repair. */
export const userVisibleFailureRate = () => production.userVisibleShare;

/* ------------------------------------------------------------------ */
/* Confounds — these belong in chart footnotes, not an appendix        */
/* ------------------------------------------------------------------ */

export const CONFOUNDS = {
  promptConditions:
    "One condition for all models and formats. Each format uses the system prompt generated by its own SDK, and all three carry the same two worked examples. The 70-component protocol catalogs are checked against one shared reference catalog.",
  attachRule:
    "Prompt content moves these numbers about as much as format choice does: one rule telling the model to attach every component it defines was worth 13 points to OpenUI on Kimi in earlier runs.",
  scoring:
    "Scoring is each SDK's own shipped code plus one shared structural-validation layer with a component-count floor; the layer credits json-render's native children slot wherever a component's single ref prop allows it, and consumes A2UI validation errors its itemized checks would miss.",
  firstParty: "We built OpenUI. Read this as a first-party benchmark with everything disclosed.",
};

/* ------------------------------------------------------------------ */
/* 7. Generation speed — the older token benchmark                     */
/* ------------------------------------------------------------------ */

/**
 * A SEPARATE, EARLIER benchmark (benchmarks/README.md). Do not splice its
 * numbers into the 46-brief run above: different scenarios, one model, and a
 * different set of competitors — YAML and Thesys C1 JSON instead of A2UI.
 *
 * Method, stated plainly because it is not a timing benchmark: one OpenUI
 * generation per scenario from GPT-5.2 at temperature 0, parsed to an AST, then
 * projected losslessly into the other three encodings of the SAME screen.
 * Tokens counted with tiktoken (gpt-5 encoder). "Decode time" is arithmetic on
 * those token counts at a fixed 60 tokens/second — a model-independent way to
 * read the size difference as time, NOT a wall-clock measurement.
 */
export const DECODE_TOKENS_PER_SECOND = 60;

export const SPEED_FORMATS = [
  { id: "openuiLang", label: "OpenUI", slot: 1 },
  { id: "c1Json", label: "Thesys C1 JSON", slot: 3 },
  { id: "jsonRenderPatch", label: "json-render", slot: 3 },
  { id: "yamlSpec", label: "YAML", slot: 3 },
] as const;

export type SpeedFormatId = (typeof SPEED_FORMATS)[number]["id"];

export const speedScenarios: Array<{ scenario: string } & Record<SpeedFormatId, number>> = [
  { scenario: "simple-table", openuiLang: 148, c1Json: 357, jsonRenderPatch: 340, yamlSpec: 316 },
  {
    scenario: "chart-with-data",
    openuiLang: 231,
    c1Json: 516,
    jsonRenderPatch: 520,
    yamlSpec: 464,
  },
  { scenario: "contact-form", openuiLang: 294, c1Json: 849, jsonRenderPatch: 893, yamlSpec: 762 },
  {
    scenario: "dashboard",
    openuiLang: 1_226,
    c1Json: 2_261,
    jsonRenderPatch: 2_247,
    yamlSpec: 2_128,
  },
  {
    scenario: "pricing-page",
    openuiLang: 1_195,
    c1Json: 2_379,
    jsonRenderPatch: 2_487,
    yamlSpec: 2_230,
  },
  {
    scenario: "settings-panel",
    openuiLang: 540,
    c1Json: 1_205,
    jsonRenderPatch: 1_244,
    yamlSpec: 1_077,
  },
  {
    scenario: "e-commerce-product",
    openuiLang: 1_166,
    c1Json: 2_381,
    jsonRenderPatch: 2_449,
    yamlSpec: 2_145,
  },
];

export const speedTotal = (id: SpeedFormatId) => speedScenarios.reduce((n, r) => n + r[id], 0);

/** Seconds to decode all seven screens at the fixed rate. */
export const speedSeconds = (id: SpeedFormatId) => speedTotal(id) / DECODE_TOKENS_PER_SECOND;

/** How much smaller OpenUI is than `id`, as a percentage. */
export const speedSavingVs = (id: SpeedFormatId) =>
  (1 - speedTotal("openuiLang") / speedTotal(id)) * 100;

/* ------------------------------------------------------------------ */
/* 8. The frontier — cost against reliability, one point per pairing    */
/* ------------------------------------------------------------------ */

/**
 * The composite axis, stated so it can be argued with: a screen is only useful
 * if it renders AND carries what was asked for, but the two failures are not
 * equally bad — a blank screen is worse than a screen missing one of twelve
 * requirements. 70/30 completion/renderable is a judgement, not a measurement,
 * which is why the page ships the completion-only axis as the default.
 */
export const COMPOSITE_WEIGHTS = { complete: 0.7, renderable: 0.3 };

export const compositeScore = (modelId: ModelId, id: FormatId) => {
  const c = runCounts[modelId][id];
  return (
    COMPOSITE_WEIGHTS.complete * (c.complete / c.runs) * 100 +
    COMPOSITE_WEIGHTS.renderable * (c.renderable / c.runs) * 100
  );
};

export type FrontierAxis = "completion" | "composite";

export type FrontierPoint = {
  model: ModelId;
  format: FormatId;
  /** USD per 1,000 screens at list prices. */
  cost: number;
  /** Reliability on the selected axis, 0–100. */
  score: number;
  /** True when some other pairing is at least as reliable and no dearer. */
  dominated: boolean;
};

/**
 * One point per priced model × format. Sol is absent throughout: OpenAI
 * publishes no per-token price for it, and a frontier drawn against a guessed
 * price is not a frontier.
 */
export const frontierPoints = (
  axis: FrontierAxis = "completion",
  models: readonly ModelId[] = COST_MODELS,
  formats: readonly FormatId[] = FORMAT_ORDER,
): FrontierPoint[] => {
  const pts = models
    .filter((m) => costPerPass[m])
    .flatMap((m) =>
      formats.map((f) => ({
        model: m,
        format: f,
        cost: costPer1kScreens(m, f),
        score: axis === "completion" ? completionByModel[m][f] : compositeScore(m, f),
      })),
    );
  return pts.map((p) => ({
    ...p,
    dominated: pts.some(
      (q) =>
        q !== p && q.cost <= p.cost && q.score >= p.score && (q.cost < p.cost || q.score > p.score),
    ),
  }));
};

/** Non-dominated points, cheapest first — the staircase the line is drawn through. */
export const frontierLine = (...args: Parameters<typeof frontierPoints>) =>
  frontierPoints(...args)
    .filter((p) => !p.dominated)
    .sort((a, b) => a.cost - b.cost);

/* ------------------------------------------------------------------ */
/* 9. Page metadata and changelog                                      */
/* ------------------------------------------------------------------ */

export const BENCHMARK_VERSION = "v1";
export const BENCHMARK_UPDATED = "25 Aug 2026";

/* Provenance points at main rather than a pinned scorer tag: the published
   numbers track the repository's current state, so there is one place to look
   and no second regime to keep straight. */
export const REPO_ROOT = "https://github.com/thesysdev/generative-ui-bench";
const REPO_TREE = `${REPO_ROOT}/tree/main`;
export const LINKS = {
  rawData: `${REPO_TREE}/results`,
  rawOutputs: `${REPO_TREE}/raw`,
  harness: REPO_ROOT,
  briefs: `${REPO_TREE}/briefs/briefs.ts`,
  catalog: `${REPO_TREE}/catalog/public-catalog.json`,
  latestHarness: REPO_TREE,
  latestReadme: `${REPO_TREE}/README.md`,
  speedHarness: REPO_ROOT,
  dispute: `${REPO_ROOT}/issues/new`,
};

export const CHANGELOG = [
  {
    date: "25 Aug 2026",
    version: "v2",
    entries: [
      "Rescored 24–25 Aug 2026 against one build of the shipped OpenUI parser, lang-core 0.2.16, whose parser validates enum and scalar prop values. Every row on the site and in the repository is now on that single regime.",
      "Google's seat in the cross-format slice moves from Gemini 3.6 Flash to Gemini 3.7 Flash. Gemini 3.6 Flash stays on the model board.",
      "Rows 14 and 21–29 ran with an 8,192-token output ceiling for condition uniformity, because Phi-4's native context cannot fit the prompt plus a 16,384-token output request. Legs that truncated were rerun at the headline ceiling under a pre-registered replace-with-whatever-it-gives rule; no truncations remain except two on DiffusionGemma, which is served at a 16,384-token total window.",
      "GPT-5.6 Terra reflects a rescore of its committed raws after the original results file was found to be from a different roll.",
      "Ling 3.0 Flash was run and excluded: its serving returned empty outputs on 42 of 184 legs, which is not scoreable fairly.",
    ],
  },
  {
    date: "18 Aug 2026",
    version: "v1",
    entries: [
      "First published run: 46 briefs, 6 models, 3 formats, 4 generations per brief — 1,104 scored runs per format.",
      "Uniform condition across every model and format. Gemini's A2UI and json-render legs were generated at 10 repeats before the 4-generation rule was settled; the scored set is the first 4 by a fixed rule, not by outcome.",
      "Density bands recomputed from the per-run verdicts rather than carried over from an earlier chart.",
      "An extra Terra run is committed but excluded from every average — one seat per company.",
    ],
  },
];

export const REFRESH_POLICY =
  "Re-run on a frontier model release, and whenever a format ships a new major version of its SDK. Every re-run gets a changelog entry and a version bump; superseded numbers stay in git history rather than being edited away.";
