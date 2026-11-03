import { ToolExecutionError, type DataTool, type ExecutionContext } from "./types";

// Only the parts of the MCP SDK's types used here, so the SDK stays an optional
// peer: the published declarations never import it.

/** An MCP tool, as the server lists it. */
export interface McpTool {
  name: string;
  description?: string;
  inputSchema: { type: "object"; properties?: Record<string, unknown>; required?: string[] };
  annotations?: { readOnlyHint?: boolean };
}

interface McpCallToolResult {
  content?: unknown;
  structuredContent?: unknown;
  toolResult?: unknown;
  isError?: boolean;
}

/** An MCP client, such as `Client` from `@modelcontextprotocol/sdk`. */
export interface McpToolClient {
  listTools(params?: { cursor?: string }): Promise<{ tools: McpTool[]; nextCursor?: string }>;
  callTool(
    params: { name: string; arguments?: Record<string, unknown> },
    resultSchema?: undefined,
    options?: { signal?: AbortSignal },
  ): Promise<McpCallToolResult>;
}

/** Which tools an MCP server offers your artifacts, and how calls reach it. */
export interface McpConfig<Context extends ExecutionContext = ExecutionContext> {
  client: McpToolClient;
  /**
   * Which tools to offer, by MCP name or with a filter. Default: the tools the
   * server marks read-only (`readOnlyHint`), since scripts run on every view.
   */
  include?: string[] | ((tool: McpTool) => boolean);
  /** Example outputs by MCP tool name, so artifacts know the shape of the data. */
  outputs?: Record<string, unknown>;
  /**
   * The client each call goes through, such as one with the signed-in user's
   * credentials from `context`. Defaults to `client`.
   */
  connect?: (context: Context) => McpToolClient | Promise<McpToolClient>;
}

/** An MCP server's tools as data tools: its client, or a config with it. */
export type McpOption<Context extends ExecutionContext = ExecutionContext> =
  McpToolClient | McpConfig<Context>;

/** One MCP server, or several: their tools are offered together. */
export type McpServers<Context extends ExecutionContext = ExecutionContext> =
  McpOption<Context> | readonly McpOption<Context>[];

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

/**
 * A dashboard filter nobody has picked yet arrives as `""` or `null`. MCP
 * servers validate strictly, so leave those out of optional arguments, as if
 * they weren't passed. A required one still goes as is, for the server to judge.
 */
function setArguments(args: Record<string, unknown>, required: Set<string>) {
  return Object.fromEntries(
    Object.entries(args).filter(
      ([key, value]) => required.has(key) || (value !== "" && value !== null),
    ),
  );
}

/** Generation needs tool names like `get_sales`; MCP names often have `-` or `.`. */
const toolKey = (name: string) => name.replace(/[^A-Za-z0-9_]/g, "_").replace(/^(?=\d)/, "_");

/** `mcp` as a list: none, one server, or several. */
export const mcpServers = <Context extends ExecutionContext>(
  mcp: McpServers<Context> | undefined,
): McpOption<Context>[] =>
  mcp === undefined ? [] : Array.isArray(mcp) ? [...mcp] : [mcp as McpOption<Context>];

/** Your tools plus an MCP server's, refusing two with one name. */
export function mergeTools<T>(own: Record<string, T> | undefined, mcp: Record<string, T>) {
  for (const name of Object.keys(mcp)) {
    if (own && Object.hasOwn(own, name)) {
      invalidTools(`Two data tools are named ${name}: rename yours or leave an MCP one out`);
    }
  }
  return { ...own, ...mcp };
}

/**
 * Lists an MCP server's tools on first use, and the same ones after that: an
 * MCP tool becomes a data tool, and its calls go through `connect(context)`.
 * A failed listing is retried on the next call.
 */
export function mcpToolLoader<Context extends ExecutionContext>(
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
    const listed: McpTool[] = [];
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
      const required = new Set(tool.inputSchema.required ?? []);
      const key = toolKey(tool.name);
      if (Object.hasOwn(tools, key)) invalidTools(`Two MCP tools map to the name ${key}`);
      tools[key] = {
        ...(tool.description !== undefined && { description: tool.description }),
        parameters: tool.inputSchema,
        ...(outputs && Object.hasOwn(outputs, tool.name) && { output: outputs[tool.name] }),
        execute: async (args, context, { signal }) => {
          const mcp = connect ? await connect(context) : client;
          const result = await mcp.callTool(
            { name: tool.name, arguments: setArguments(args, required) },
            undefined,
            { signal },
          );
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
