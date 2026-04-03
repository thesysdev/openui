/**
 * MCP ToolProvider — connects openui-lang Query() to any MCP server.
 *
 * Two modes:
 *   1. URL mode: pass a URL, we create the MCP Client internally
 *   2. Client mode: pass a pre-configured MCP Client
 *
 * Both speak proper MCP protocol (JSON-RPC). Both provide tool discovery
 * via listTools() for auto-generating LLM prompts.
 *
 * @example
 * ```tsx
 * // Mode 1: URL (we handle everything)
 * const mcp = await connectMcp({ url: "https://my-api.com/mcp" });
 *
 * // Mode 2: Pre-configured client
 * const mcp = await connectMcp({ client: myMcpClient });
 *
 * // Use with Renderer — mcp satisfies ToolProvider directly
 * const tools = await mcp.listTools();
 * <Renderer toolProvider={mcp} library={library} response={content} />
 *
 * // Cleanup
 * await mcp.disconnect();
 * ```
 */

import type { ToolProvider } from "./queryManager";

/** Tool schema from MCP server — used for prompt generation */
export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface McpConnectionConfig {
  /** MCP server URL — creates Client + StreamableHTTPClientTransport internally */
  url?: string;
  /** Pre-configured MCP Client instance (from @modelcontextprotocol/sdk) */
  client?: McpClientLike;
  /** Optional headers for URL mode (e.g. auth tokens) */
  headers?: Record<string, string>;
}

/** Result of connectMcp — satisfies ToolProvider directly, plus tool discovery + cleanup */
export interface McpConnection {
  /** Satisfies ToolProvider directly — pass to <Renderer toolProvider={mcp} /> */
  callTool(toolName: string, args: Record<string, unknown>): Promise<unknown>;
  /** Discover available tools for prompt generation */
  listTools(): Promise<McpTool[]>;
  /** Disconnect from MCP server */
  disconnect(): Promise<void>;
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
  listTools(params?: { cursor?: string }): Promise<{
    tools: McpTool[];
    nextCursor?: string;
  }>;
  close?(): Promise<void>;
}

/**
 * Extract the actual data from an MCP callTool result.
 * Prefers structuredContent (machine-readable JSON), falls back to parsing text content.
 */
function extractToolResult(result: {
  content: Array<{ type: string; text?: string; [key: string]: unknown }>;
  structuredContent?: unknown;
  isError?: boolean;
}): unknown {
  if (result.isError) {
    const errorText = result.content
      ?.filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");
    throw new Error(`MCP tool error: ${errorText || "Unknown error"}`);
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

/**
 * Connect to an MCP server — returns a ToolProvider + tool discovery + cleanup.
 *
 * @param config - URL or pre-configured MCP Client
 * @returns McpConnection (satisfies ToolProvider directly)
 */
export async function connectMcp(config: McpConnectionConfig): Promise<McpConnection> {
  let client: McpClientLike;
  let ownsClient = false;

  if (config.client) {
    client = config.client;
  } else if (config.url) {
    try {
      const clientMod = await import("@modelcontextprotocol/sdk/client/index.js");
      const transportMod = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");
      const { Client } = clientMod;
      const { StreamableHTTPClientTransport } = transportMod;

      const mcpClient = new Client({ name: "openui-lang", version: "1.0.0" });
      const base =
        typeof globalThis.location !== "undefined" ? globalThis.location.href : undefined;
      const url = new URL(config.url, base);
      const connectOpts: Record<string, unknown> = {};
      if (config.headers) {
        connectOpts.requestInit = { headers: config.headers };
      }
      const mcpTransport = new StreamableHTTPClientTransport(url, connectOpts);
      await mcpClient.connect(mcpTransport);

      client = mcpClient as unknown as McpClientLike;
      ownsClient = true;
    } catch (err: any) {
      throw new Error(
        `Failed to connect to MCP server. Make sure @modelcontextprotocol/sdk is installed:\n` +
          `  pnpm add @modelcontextprotocol/sdk\n\n` +
          `Original error: ${err.message}`,
      );
    }
  } else {
    throw new Error("connectMcp requires either { url } or { client }");
  }

  const toolProvider: ToolProvider = {
    async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
      const result = await client.callTool({ name: toolName, arguments: args });
      return extractToolResult(result);
    },
  };

  return {
    callTool: toolProvider.callTool.bind(toolProvider),

    async listTools(): Promise<McpTool[]> {
      const allTools: McpTool[] = [];
      let cursor: string | undefined;
      const seenCursors = new Set<string>();
      let iterations = 0;
      const MAX_PAGES = 100;
      do {
        if (++iterations > MAX_PAGES) break;
        const result = await client.listTools(cursor ? { cursor } : undefined);
        allTools.push(...result.tools);
        cursor = result.nextCursor;
        if (cursor) {
          if (seenCursors.has(cursor)) break;
          seenCursors.add(cursor);
        }
      } while (cursor);
      return allTools;
    },

    async disconnect(): Promise<void> {
      if (ownsClient && client.close) {
        await client.close();
      }
    },
  };
}
