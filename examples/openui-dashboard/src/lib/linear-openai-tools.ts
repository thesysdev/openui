/**
 * Map Linear MCP tools to OpenAI runTools() shape + lang-core ToolSpec for prompts.
 */
import type { Tool as McpTool } from "@modelcontextprotocol/sdk/types.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { ToolSpec } from "@openuidev/lang-core";
import { extractToolResult, McpToolError } from "@openuidev/lang-core";
import type { RunnableToolFunction } from "openai/lib/RunnableFunction";
import type { JSONSchema } from "openai/lib/jsonschema";

function mcpToolToToolSpec(t: McpTool): ToolSpec {
  return {
    name: t.name,
    description: t.description,
    inputSchema: (t.inputSchema ?? {}) as Record<string, unknown>,
    outputSchema: {},
  };
}

function mcpToolToRunnable(
  t: McpTool,
  client: Client,
): RunnableToolFunction<Record<string, unknown>> {
  return {
    type: "function",
    function: {
      name: t.name,
      description: t.description ?? "",
      parameters: (t.inputSchema ?? { type: "object", properties: {} }) as JSONSchema,
      function: async (args: Record<string, unknown>) => {
        try {
          const result = await client.callTool({ name: t.name, arguments: args });
          const data = extractToolResult(
            result as Parameters<typeof extractToolResult>[0],
          );
          return typeof data === "string" ? data : JSON.stringify(data);
        } catch (e) {
          if (e instanceof McpToolError) {
            return JSON.stringify({ error: e.toolErrorText });
          }
          throw e;
        }
      },
      parse: JSON.parse,
    },
  };
}

export function linearMcpToolsToOpenAI(
  mcpTools: McpTool[],
  client: Client,
): {
  openaiTools: RunnableToolFunction<Record<string, unknown>>[];
  toolSpecs: ToolSpec[];
} {
  return {
    openaiTools: mcpTools.map((tool) => mcpToolToRunnable(tool, client)),
    toolSpecs: mcpTools.map(mcpToolToToolSpec),
  };
}
