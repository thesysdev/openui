import { ToolExecutionError, type DataTool } from "./types";

/** A tool as an MCP server lists it. */
export interface McpToolInfo {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
}

/** What an MCP tool call returns. */
export interface McpCallToolResult {
  content?: unknown;
  structuredContent?: unknown;
  isError?: boolean;
  /** The result shape of servers on the older protocol. */
  toolResult?: unknown;
  [key: string]: unknown;
}

/** An MCP client, such as `Client` from `@modelcontextprotocol/sdk`. */
export interface McpToolClient {
  listTools(params?: { cursor?: string }): Promise<{ tools: McpToolInfo[]; nextCursor?: string }>;
  callTool(
    params: { name: string; arguments?: Record<string, unknown> },
    resultSchema?: undefined,
    options?: { signal?: AbortSignal },
  ): Promise<McpCallToolResult>;
}

export interface McpToolsOptions<Context = undefined> {
  /** Which tools to expose, by name or with a filter. Default: all of them. */
  include?: string[] | ((tool: McpToolInfo) => boolean);
  /** Example outputs by tool name, so artifacts know the shape of the data. */
  outputs?: Record<string, unknown>;
  /**
   * The client each call goes through, such as one with the signed-in user's
   * credentials from `context`. Defaults to the client you pass.
   */
  connect?: (context: Context) => McpToolClient | Promise<McpToolClient>;
}

const textOf = (content: unknown): string | undefined => {
  if (!Array.isArray(content)) return undefined;
  const texts = content.flatMap((part: { type?: unknown; text?: unknown }) =>
    part?.type === "text" && typeof part.text === "string" ? [part.text] : [],
  );
  return texts.length ? texts.join("\n") : undefined;
};

/** Structured content when the tool returns it, else its text, parsed as JSON when it is. */
function resultOf(result: McpCallToolResult): unknown {
  if (result.structuredContent !== undefined) return result.structuredContent;
  if (result.content === undefined && result.toolResult !== undefined) return result.toolResult;
  const text = textOf(result.content);
  if (text === undefined) return result.content ?? null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Data tools from an MCP server, ready for `openui.createInterpreter` and
 * `openui.artifacts`. Lists the server's tools once; each call goes through
 * `connect(context)`, or the client you pass.
 *
 * ```ts
 * const dataTools = {
 *   ...ownTools,
 *   ...(await mcpTools(mcp, { connect: (context) => mcpClientFor(context.userId) })),
 * };
 * ```
 */
export async function mcpTools<Context = undefined>(
  client: McpToolClient,
  options: McpToolsOptions<Context> = {},
): Promise<Record<string, DataTool<Context>>> {
  const { include, outputs, connect } = options;
  const listed: McpToolInfo[] = [];
  let cursor: string | undefined;
  do {
    const page = await client.listTools(cursor ? { cursor } : undefined);
    listed.push(...page.tools);
    cursor = page.nextCursor;
  } while (cursor);

  const included = (tool: McpToolInfo) =>
    include === undefined
      ? true
      : typeof include === "function"
        ? include(tool)
        : include.includes(tool.name);

  return Object.fromEntries(
    listed.filter(included).map((tool): [string, DataTool<Context>] => [
      tool.name,
      {
        ...(tool.description !== undefined && { description: tool.description }),
        parameters: tool.inputSchema,
        ...(outputs && Object.hasOwn(outputs, tool.name) && { output: outputs[tool.name] }),
        execute: async (context, args, { signal }) => {
          const mcp = connect ? await connect(context) : client;
          const result = await mcp.callTool({ name: tool.name, arguments: args }, undefined, {
            signal,
          });
          // MCP reports a failed call in its result; throw so it surfaces as a tool error.
          if (result.isError) {
            throw new ToolExecutionError(
              textOf(result.content) ?? `${tool.name} failed`,
              "tool_exec_error",
            );
          }
          return resultOf(result);
        },
      },
    ]),
  );
}
