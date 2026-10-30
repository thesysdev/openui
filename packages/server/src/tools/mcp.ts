import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolExecutionError, type DataTool } from "./types";

/** An MCP client, such as `Client` from `@modelcontextprotocol/sdk`. */
export type McpToolClient = Pick<Client, "listTools" | "callTool">;

type McpCallToolResult = Awaited<ReturnType<McpToolClient["callTool"]>>;

/** Which tools an MCP server offers your artifacts, and how calls reach it. */
export interface McpConfig<Context = undefined> {
  client: McpToolClient;
  /**
   * Which tools to offer, by MCP name or with a filter. Default: the tools the
   * server marks read-only (`readOnlyHint`), since scripts run on every view.
   */
  include?: string[] | ((tool: Tool) => boolean);
  /** Example outputs by MCP tool name, so artifacts know the shape of the data. */
  outputs?: Record<string, unknown>;
  /**
   * The client each call goes through, such as one with the signed-in user's
   * credentials from `context`. Defaults to `client`.
   */
  connect?: (context: Context) => McpToolClient | Promise<McpToolClient>;
}

/** An MCP server's tools as data tools: its client, or a config with it. */
export type McpOption<Context = undefined> = McpToolClient | McpConfig<Context>;

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

function invalidTools(message: string): never {
  throw new ToolExecutionError(message, "invalid_tools");
}

/** Generation needs tool names like `get_sales`; MCP names often have `-` or `.`. */
const toolKey = (name: string) => name.replace(/[^A-Za-z0-9_]/g, "_").replace(/^(?=\d)/, "_");

/** Your tools plus the MCP server's, refusing two with one name. */
export function mergeTools<T>(own: Record<string, T> | undefined, mcp: Record<string, T>) {
  for (const name of Object.keys(mcp)) {
    if (own && Object.hasOwn(own, name)) {
      invalidTools(`Two data tools are named ${name}: rename yours or leave the MCP one out`);
    }
  }
  return { ...own, ...mcp };
}

/**
 * Lists an MCP server's tools on first use, and the same ones after that: an
 * MCP tool becomes a data tool, and its calls go through `connect(context)`.
 * A failed listing is retried on the next call.
 */
export function mcpToolLoader<Context>(
  option: McpOption<Context>,
): () => Promise<Record<string, DataTool<Context>>> {
  const isClient = typeof (option as McpToolClient).listTools === "function";
  const { client, include, outputs, connect }: McpConfig<Context> = isClient
    ? { client: option as McpToolClient }
    : (option as McpConfig<Context>);
  if (typeof client?.listTools !== "function") {
    invalidTools("mcp takes an MCP client, or { client } with one");
  }
  let loading: Promise<Record<string, DataTool<Context>>> | undefined;

  async function load(): Promise<Record<string, DataTool<Context>>> {
    const listed: Tool[] = [];
    let cursor: string | undefined;
    try {
      do {
        const page = await client.listTools(cursor ? { cursor } : undefined);
        listed.push(...page.tools);
        cursor = page.nextCursor;
      } while (cursor);
    } catch (error) {
      throw new ToolExecutionError(
        `Couldn't list the MCP server's tools: ${error instanceof Error ? error.message : String(error)}`,
        "mcp_error",
        502,
      );
    }

    const included = listed.filter((tool) =>
      include === undefined
        ? tool.annotations?.readOnlyHint === true
        : typeof include === "function"
          ? include(tool)
          : include.includes(tool.name),
    );
    if (!included.length) {
      invalidTools(
        include === undefined
          ? "The MCP server marks no tools read-only: pick them with `include`"
          : "No MCP tools match `include`",
      );
    }

    const tools: Record<string, DataTool<Context>> = {};
    for (const tool of included) {
      const key = toolKey(tool.name);
      if (Object.hasOwn(tools, key)) invalidTools(`Two MCP tools map to the name ${key}`);
      tools[key] = {
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
      };
    }
    return tools;
  }

  return () => {
    loading ??= load().catch((error: unknown) => {
      loading = undefined;
      throw error;
    });
    return loading;
  };
}
