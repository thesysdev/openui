import { OpenUIApiError, ToolExecutionError } from "@openuidev/server";
import { dashboards } from "../../../lib/openui";

export const runtime = "nodejs";

// Runs a dashboard's Query() calls for the browser: a data tool by name, or a script the
// dashboard was generated with, which OpenUI Cloud runs and which calls the same data tools.
// The data stays on this server; only the dashboard's results reach the browser.
export async function POST(request: Request) {
  try {
    const result = await dashboards.interpreter.execute(await request.json(), undefined, {
      signal: request.signal,
    });
    return Response.json({ result });
  } catch (error) {
    const known = error instanceof ToolExecutionError || error instanceof OpenUIApiError;
    return Response.json(
      {
        error: {
          code: known ? error.code : "internal_error",
          message: error instanceof Error ? error.message : String(error),
        },
      },
      { status: known ? (error.status ?? 500) : 500 },
    );
  }
}
