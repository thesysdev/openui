// Numbers for the OUI-1 post (content/blog/oui-1.mdx). Public-protocol
// figures come from generative-ui-bench/score.ts on the raw/ labels named
// below; the charts read from here and hardcode nothing.

export type ScatterPoint = {
  id: string;
  label: string;
  score: number; // Generative UI Benchmark score, %
  params: number; // active parameters, billions
  hero?: boolean;
  ghost?: boolean; // the base-model point the arrow starts from
};

// Every open-weight model on the public board with <= 31B active parameters.
export const SCATTER: ScatterPoint[] = [
  { id: "ours", label: "OUI-1 (DiffusionGemma, finetuned)", score: 71.7, params: 4, hero: true },
  { id: "dgbase", label: "DiffusionGemma", score: 13.0, params: 4, ghost: true },
  { id: "qwen38-27b", label: "Qwen3.8 27B", score: 78.8, params: 27 },
  { id: "qwen36-27b", label: "Qwen3.6 27B", score: 68.5, params: 27 },
  { id: "qwen36-a3b", label: "Qwen3.6 35B-A3B", score: 61.4, params: 3 },
  { id: "g31", label: "Gemma 4 31B", score: 46.7, params: 31 },
  { id: "phi4", label: "Phi-4 14B", score: 44.0, params: 14 },
  { id: "twin", label: "Gemma 4 26B-A4B", score: 29.9, params: 4 },
  { id: "ministral", label: "Ministral 8B", score: 27.2, params: 8 },
  { id: "granite", label: "Granite 4.1 8B", score: 14.7, params: 8 },
  { id: "lfm", label: "LFM 2.5 2.6B", score: 3.3, params: 2.6 },
];

export const FRONTIER_BAND = { lo: 90, hi: 99.5, label: "frontier models, open and closed" };

export type Stage = {
  id: string;
  label: string;
  complete: number; // of BOARD_RUNS
  schema: number; // enum, signature, required-field, hallucinated component, root
  unresolved: number; // names used but never defined
  orphans: number; // sections defined but never attached
  statements: number;
};

// 46 briefs x 4 runs, bench labels dgbase / dg-sft / dgoui1. The dg-sft
// checkpoint ran under the define-before-use prompt it was trained on, so
// unresolved and orphans are only comparable across stages as a sum.
export const STAGES: Stage[] = [
  { id: "base", label: "DiffusionGemma", complete: 24, schema: 693, unresolved: 1944, orphans: 165, statements: 7928 },
  { id: "sft", label: "after supervised finetuning", complete: 53, schema: 292, unresolved: 55, orphans: 916, statements: 7684 },
  { id: "a2", label: "OUI-1", complete: 132, schema: 14, unresolved: 49, orphans: 140, statements: 5372 },
];

export const BOARD_RUNS = 184;

// Median seconds per output on the same 20 light briefs, one request at a
// time, vLLM 0.24 FP8 on one A100, the checkpoint's own sampler settings.
export const SPEED_ARC = [
  { id: "base", label: "DiffusionGemma", secPerScreen: 1.6, note: "short outputs, 22 tokens per statement" },
  { id: "sft", label: "after supervised finetuning", secPerScreen: 4.3, note: "32 tokens per statement, about twice the denoising steps per token" },
];

// The appless phone library, 60 asks written independently of every training
// file; valid = parses clean with at least three statements.
export const CROSS_LIBRARY = { asks: 60, base: 23, ours: 55 };
