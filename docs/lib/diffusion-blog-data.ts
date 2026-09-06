/**
 * DiffusionGemma finetune blog — single source of truth for every number in
 * the post. Same rule as benchmark-data.ts: charts read from here, never
 * hardcode a number in a chart component.
 *
 * Sources: published-protocol boards (46 briefs x 4 attempts, temp 0.7,
 * identical conditions to the public leaderboard), internal seed-0 boards,
 * and the production serving bench (vLLM, FP8, one A100, single stream).
 */

/* ------------------------------------------------------------------ */
/* Hero scatter: OpenUI score vs active parameters                     */
/* ------------------------------------------------------------------ */

export type ScatterPoint = {
  id: string;
  label: string;
  score: number; // published OpenUI score, %
  params: number; // ACTIVE parameters, billions
  mark?: string;
  hero?: boolean;
  ghost?: boolean; // the before-dot the arrow starts from
};

export const SCATTER: ScatterPoint[] = [
  { id: "ours", label: "DiffusionGemma, finetuned", score: 57.1, params: 4, hero: true },
  { id: "dgbase", label: "DiffusionGemma, base", score: 13.0, params: 4, mark: "google", ghost: true },
  { id: "g31", label: "Gemma 4 31B", score: 46.7, params: 31, mark: "google" },
  { id: "phi4", label: "Phi-4 14B", score: 44.0, params: 14 },
  { id: "twin", label: "Gemma 4 26B-A4B", score: 29.9, params: 4, mark: "google" },
  { id: "ministral", label: "Ministral 8B", score: 27.2, params: 8 },
  { id: "granite", label: "Granite 4.1 8B", score: 14.7, params: 8 },
  { id: "lfm", label: "LFM 2.5 2.6B", score: 3.3, params: 2.6 },
];

/** Closed frontier models sit far above every open model here. */
export const FRONTIER_BAND = { lo: 90, hi: 99.5, label: "closed frontier models" };

/** Our second condition, quoted in the annotation. */
export const OURS_OWN_PROMPT = 60.9;

/* ------------------------------------------------------------------ */
/* The journey: defect anatomy per training stage (internal 46 board)  */
/* ------------------------------------------------------------------ */

export type Stage = {
  id: string;
  label: string;
  complete: number; // of 46
  schema: number;
  unresolved: number;
  orphans: number; // orphan sites
  statements: number;
};

export const STAGES: Stage[] = [
  { id: "base", label: "base model", complete: 11, schema: 133, unresolved: 3, orphans: 45, statements: 1753 },
  { id: "sft", label: "+ SFT", complete: 22, schema: 56, unresolved: 9, orphans: 82, statements: 1810 },
  { id: "self", label: "+ self-distillation", complete: 31, schema: 22, unresolved: 6, orphans: 23, statements: 1909 },
];

export const BOARD_BRIEFS = 46;

/* ------------------------------------------------------------------ */
/* The self-teaching loop                                              */
/* ------------------------------------------------------------------ */

export const ROUND_COST_USD = 6;
export const ROUND_HOURS = 2;

/* ------------------------------------------------------------------ */
/* The step dial: fixed denoising steps vs completed screens           */
/* ------------------------------------------------------------------ */

export type DialSeries = {
  id: string;
  label: string;
  short: string; // end-of-line tag; the full label lives in the legend
  points: Array<{ steps: number; complete: number }>;
};

export const DIAL: DialSeries[] = [
  {
    id: "r1",
    label: "early in self-distillation",
    short: "early",
    points: [
      { steps: 16, complete: 6 },
      { steps: 24, complete: 13 },
      { steps: 32, complete: 26 },
      { steps: 64, complete: 23 },
    ],
  },
  {
    id: "r3",
    label: "after self-distillation",
    short: "after",
    points: [
      { steps: 24, complete: 27 },
      { steps: 32, complete: 32 },
      { steps: 64, complete: 31 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Serving speed (vLLM, FP8, one A100, single stream, same sampler)    */
/* ------------------------------------------------------------------ */

export const SPEED = [
  { id: "base", label: "base model", secPerScreen: 1.6, toksPerSec: 276, note: "short screens, mostly boilerplate" },
  { id: "sft", label: "after SFT", secPerScreen: 6.8, toksPerSec: 124, note: "real content, slow to commit" },
  { id: "final", label: "after self-distillation", secPerScreen: 1.89, toksPerSec: 221, note: "same sampler, no config change" },
];

export const SCREENS_PER_MINUTE = 32;

/* ------------------------------------------------------------------ */
/* Difficulty bands: published runs completed per band (standard       */
/* prompt for both models; 46 briefs in 5 bands of 10/10/10/8/8)       */
/* ------------------------------------------------------------------ */

export const BANDS = [
  { id: "b1", label: "lightest", runs: 40, base: 15, ours: 35 },
  { id: "b2", label: "light", runs: 40, base: 5, ours: 28 },
  { id: "b3", label: "medium", runs: 40, base: 1, ours: 26 },
  { id: "b4", label: "dense", runs: 32, base: 0, ours: 11 },
  { id: "b5", label: "densest", runs: 32, base: 3, ours: 5 },
];
/** densest band with the model's own trained prompt */
export const B5_OWN_PROMPT = 12;
