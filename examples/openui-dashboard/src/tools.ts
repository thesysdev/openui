/**
 * Legacy shared tool registry — the dashboard now uses Linear's hosted MCP
 * (`https://mcp.linear.app/mcp`) for both the browser client and the chat API.
 *
 * - `/api/mcp` proxies to Linear with `Authorization: Bearer` from env (see `lib/linear-mcp.ts`).
 * - `/api/chat` lists tools from Linear MCP and forwards tool calls to the same server.
 *
 * `ToolDef` remains exported for any custom tooling you add alongside Linear.
 */
export { ToolDef } from "./lib/tool-def";
