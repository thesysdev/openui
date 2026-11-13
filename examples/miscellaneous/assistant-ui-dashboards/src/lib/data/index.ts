import type { DataTool } from "@openuidev/server";
import { githubTools } from "./github";
import { npmTools } from "./npm";

export { osv, osvToolSummaries } from "./osv-mcp";

// The tools dashboards load their data from. Each Query() in a dashboard calls one of these
// (or one of the OSV MCP server's) through /api/interpreter, every time the dashboard is opened.
export const dataTools: Record<string, DataTool> = { ...npmTools, ...githubTools };
