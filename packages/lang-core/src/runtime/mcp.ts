/**
 * MCP utilities — type definitions and result extraction for MCP client integration.
 *
 * The Renderer accepts an MCP client directly as `toolProvider`.
 * It detects the MCP client shape (has `callTool({ name, arguments })`) and
 * wraps responses with `extractToolResult` automatically.
 *
 * @example
 * ```tsx
 * import { Client } from "@modelcontextprotocol/sdk/client/index.js";
 * import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
 *
 * const client = new Client({ name: "my-app", version: "1.0.0" });
 * await client.connect(new StreamableHTTPClientTransport(new URL("/api/mcp")));
 *
 * // Pass directly — Renderer handles MCP response extraction
 * <Renderer toolProvider={client} library={library} response={content} />
 * ```
 */

/**
 * Error thrown when an MCP tool call returns `isError: true`.
 * Preserves the raw error content from the MCP response for structured handling.
 */
export class McpToolError extends Error {
  readonly toolErrorText: string;

  constructor(errorText: string) {
    super(`MCP tool error: ${errorText || "Unknown error"}`);
    this.name = "McpToolError";
    this.toolErrorText = errorText;
  }
}

/**
 * Minimal shape of an MCP Client — matches @modelcontextprotocol/sdk Client
 * without requiring it as a hard import. Users can pass any object that
 * implements these methods.
 */
export interface McpClientLike {
  callTool(
    params: { name: string; arguments?: Record<string, unknown> },
    options?: unknown,
  ): Promise<{
    content: Array<{ type: string; text?: string; [key: string]: unknown }>;
    structuredContent?: unknown;
    isError?: boolean;
  }>;
  close?(): Promise<void>;
}

/**
 * Extract the actual data from an MCP callTool result.
 * Prefers structuredContent (machine-readable JSON), falls back to parsing text content.
 */
export function extractToolResult(result: {
  content: Array<{ type: string; text?: string; [key: string]: unknown }>;
  structuredContent?: unknown;
  isError?: boolean;
}): unknown {
  if (result.isError) {
    const errorText = result.content
      ?.filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");
    throw new McpToolError(errorText || "Unknown error");
  }

  // Prefer structuredContent (JSON data, no parsing needed)
  if (result.structuredContent != null) {
    return result.structuredContent;
  }

  // Fall back to text content — try to parse as JSON
  const textParts = result.content?.filter((c) => c.type === "text").map((c) => c.text ?? "");
  if (textParts?.length) {
    const text = textParts.join("");
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return null;
}
