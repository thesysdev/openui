import { z } from "zod/v4";
import { resolveSession, sessionLabel, type Session, type SessionType } from "../resolve";

// One F1 tool: a zod input schema (validated on every call; the model's arguments are untrusted),
// an example of its JSON output, and run(). The registry exposes each tool twice: as a chat
// function tool and as POST /api/f1/[tool] for the charts and dashboards. The description and
// each argument's .describe() text are what the model reads when choosing and calling a tool.

export interface F1ToolResult {
  /** Which session the rows describe, e.g. "2026 Azerbaijan Grand Prix · Race". */
  session?: string;
  rows: Record<string, unknown>[];
  note?: string;
  [extra: string]: unknown;
}

export interface F1Tool<S extends z.ZodObject = z.ZodObject> {
  name: string;
  description: string;
  input: S;
  /** An example of the result shape (values illustrative), listed by GET /api/f1. */
  output: F1ToolResult;
  run(args: z.output<S>, ctx: { signal?: AbortSignal }): Promise<F1ToolResult>;
}

export function defineF1Tool<S extends z.ZodObject>(tool: F1Tool<S>): F1Tool<S> {
  return tool;
}

export const sessionArg = (what = "race") =>
  z
    .string()
    .max(60)
    .default("latest")
    .describe(
      `Which ${what}: "latest" (most recent finished), "next", a place ("Baku", "Monaco"), a round ("round 5"), a year and place ("2025 Spa"), or a slug like "2026-miami-R". Add a session word to pick another session: "Miami qualifying", "Baku FP2", "Shanghai sprint", "latest Q".`,
    );

export const driverList = (max: number) =>
  z
    .array(z.union([z.string().max(30), z.number().int()]))
    .max(max)
    .describe('Driver codes ("LEC"), numbers (16) or surnames ("Leclerc").');

/** Resolve the session argument and prefix every note with the session label. */
export async function openSession(
  ref: string | undefined,
  signal: AbortSignal | undefined,
  defaultType: SessionType = "Race",
): Promise<{ session: Session; label: string; note?: string }> {
  const { session, note } = await resolveSession(ref, { defaultType, signal });
  return { session, label: sessionLabel(session), note };
}

export function joinNotes(...notes: Array<string | undefined | null | false>) {
  const text = notes.filter(Boolean).join(" ");
  return text || undefined;
}
