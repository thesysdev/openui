import type { DataTool } from "@openuidev/server";
import { z } from "zod";

/**
 * A data tool. `parameters` describes the arguments for generation; `output` is an example
 * result, so generated dashboards know the shape of the data (static, so defining the tools
 * never calls the network); `run` reads its arguments leniently (see fetch.ts).
 */
export function dataTool(
  description: string,
  parameters: z.ZodObject,
  output: unknown,
  run: (args: Record<string, unknown>, signal: AbortSignal) => Promise<unknown>,
): DataTool {
  return {
    description,
    parameters: z.toJSONSchema(parameters),
    output,
    execute: (_context, args, { signal }) => run(args ?? {}, signal),
  };
}
