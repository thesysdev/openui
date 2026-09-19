import type { DashboardRunResult } from "./types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** `undefined` must serialize as `null` so renderer providers always receive `result`. */
export const runSuccess = (result: unknown): DashboardRunResult => ({
  ok: true,
  status: 200,
  body: { result: result === undefined ? null : result },
});

export const runFailure = (code: string, message: string, status: number): DashboardRunResult => ({
  ok: false,
  status,
  body: { error: { code, message } },
});
