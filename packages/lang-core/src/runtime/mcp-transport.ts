/**
 * MCP Transport — connects openui-lang Query() to any MCP server.
 *
 * Two modes:
 *   1. URL mode: pass a URL, we create the MCP Client + transport internally
 *   2. Client mode: pass a pre-configured MCP Client
 *
 * Both speak proper MCP protocol (JSON-RPC). Both provide tool discovery
 * via listTools() for auto-generating LLM prompts.
 *
 * @example
 * ```tsx
 * // Mode 1: URL (we handle everything)
 * const mcp = await createMcpTransport({ url: "https://my-api.com/mcp" });
 *
 * // Mode 2: Pre-configured client (you handle auth, transport choice)
 * import { Client } from "@modelcontextprotocol/sdk/client";
 * import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp";
 * const client = new Client({ name: "my-app", version: "1.0.0" });
 * await client.connect(new StreamableHTTPClientTransport(new URL("https://my-api.com/mcp")));
 * const mcp = await createMcpTransport({ client });
 *
 * // Use with Renderer
 * const tools = await mcp.listTools();
 * const prompt = library.prompt({ tools: tools.map(t => ({ name: t.name, description: t.description })) });
 * <Renderer transport={mcp.transport} library={library} response={content} />
 *
 * // Cleanup
 * await mcp.disconnect();
 * ```
 */

import type { Transport } from "./queryManager";

/** Tool schema from MCP server — used for prompt generation */
export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface McpTransportConfig {
  /** MCP server URL — creates Client + StreamableHTTPClientTransport internally */
  url?: string;
  /** Pre-configured MCP Client instance (from @modelcontextprotocol/sdk) */
  client?: McpClientLike;
  /** Optional headers for URL mode (e.g. auth tokens) */
  headers?: Record<string, string>;
}

/** Result of createMcpTransport — transport + tool discovery + cleanup */
export interface McpConnection {
  /** Transport for Renderer/QueryManager — just callTool() */
  transport: Transport;
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
 * Create an MCP connection with transport + tool discovery.
 *
 * @param config - URL or pre-configured MCP Client
 * @returns McpConnection with transport, listTools(), and disconnect()
 */
export async function createMcpTransport(config: McpTransportConfig): Promise<McpConnection> {
  let client: McpClientLike;
  let ownsClient = false;

  if (config.client) {
    // Mode 2: User provides pre-configured client
    client = config.client;
  } else if (config.url) {
    // Mode 1: Create client + transport from URL
    try {
      // Dynamic import — @modelcontextprotocol/sdk is an optional peer dep
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const clientMod = await import("@modelcontextprotocol/sdk/client/index.js");
      const transportMod = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");
      const { Client } = clientMod;
      const { StreamableHTTPClientTransport } = transportMod;

      const mcpClient = new Client({ name: "openui-lang", version: "1.0.0" });
      const base =
        typeof globalThis.location !== "undefined" ? globalThis.location.href : undefined;
      const url = new URL(config.url, base);
      const transportOpts: Record<string, unknown> = {};
      if (config.headers) {
        transportOpts.requestInit = { headers: config.headers };
      }
      const mcpTransport = new StreamableHTTPClientTransport(url, transportOpts);
      await mcpClient.connect(mcpTransport);

      client = mcpClient as unknown as McpClientLike;
      ownsClient = true;
    } catch (err: any) {
      throw new Error(
        `Failed to create MCP transport. Make sure @modelcontextprotocol/sdk is installed:\n` +
          `  pnpm add @modelcontextprotocol/sdk\n\n` +
          `Original error: ${err.message}`,
      );
    }
  } else {
    throw new Error("createMcpTransport requires either { url } or { client }");
  }

  // Build the Transport interface for QueryManager
  const transport: Transport = {
    async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
      const result = await client.callTool({ name: toolName, arguments: args });
      return extractToolResult(result);
    },
  };

  return {
    transport,

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
          if (seenCursors.has(cursor)) break; // cursor loop detected
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
