import { z } from "zod/v4";
import type { ChatCompletionFunctionTool } from "openai/resources/chat/completions";
import { getTeamRadio, getWeather } from "./conditions";
import type { F1Tool, F1ToolResult } from "./define";
import { getGaps, getLapTimes, getPositions, getRaceControl, getStints, getTimingTower } from "./race";
import { getResults } from "./results";
import { getDrivers, getSchedule, getStandings } from "./season";
import { getTelemetry } from "./telemetry";

// The F1 tool registry. Door A: chat function tools run by the server's tool loop.
// Door B: POST /api/f1/[tool], which the F1 charts and dashboards call for their own rows.

const tools = [
  getSchedule,
  getStandings,
  getResults,
  getDrivers,
  getLapTimes,
  getGaps,
  getPositions,
  getStints,
  getRaceControl,
  getTimingTower,
  getTelemetry,
  getWeather,
  getTeamRadio,
] as unknown as F1Tool[];

export const f1Tools: Record<string, F1Tool> = Object.fromEntries(tools.map((tool) => [tool.name, tool]));

export type { F1Tool, F1ToolResult };

/** Run a tool by name with untrusted arguments; throws on unknown names or invalid input. */
export async function runF1Tool(name: string, args: unknown, ctx: { signal?: AbortSignal } = {}) {
  const tool = Object.hasOwn(f1Tools, name) ? f1Tools[name] : undefined;
  if (!tool) throw new RangeError(`Unknown F1 tool: ${name}`);
  const parsed = tool.input.safeParse(args ?? {});
  if (!parsed.success) throw new RangeError(`Invalid arguments for ${name}: ${z.prettifyError(parsed.error)}`);
  return tool.run(parsed.data, ctx);
}

/** Tool specs for Chat Completions. Arguments are validated again by runF1Tool. */
export function f1FunctionTools(): ChatCompletionFunctionTool[] {
  return tools.map((tool) => {
    const { $schema: _, ...parameters } = z.toJSONSchema(tool.input, { io: "input" }) as Record<string, unknown>;
    return {
      type: "function",
      function: { name: tool.name, description: tool.description, parameters },
    };
  });
}

/** name → executor for runChatToolLoop (JSON string in, JSON string out). */
export function f1Executors() {
  return Object.fromEntries(
    tools.map((tool) => [
      tool.name,
      async (argsJson: string, { signal }: { signal?: AbortSignal }) =>
        JSON.stringify(await runF1Tool(tool.name, argsJson.trim() ? JSON.parse(argsJson) : {}, { signal })),
    ]),
  );
}

/** Name, description, and input/output JSON schemas, e.g. for a prompt's tool list. */
export function f1ToolSpecs() {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: z.toJSONSchema(tool.input, { io: "input" }),
    outputExample: tool.output,
  }));
}
