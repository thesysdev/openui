/**
 * MCP Server — exposes all tools via MCP protocol.
 *
 * Tool definitions live in src/tools.ts (shared with /api/chat).
 * This file only sets up the MCP transport and registers tools.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { tools } from "../../../tools";

// ── MCP Server factory ───────────────────────────────────────────────────────

function createServer(): McpServer {
  const server = new McpServer(
    { name: "openui-tools", version: "1.0.0" },
  );

  for (const tool of tools) {
    server.registerTool(tool.name, {
      description: tool.description,
      inputSchema: tool.inputSchema,
    }, async (args) => ({
      content: [{ type: "text" as const, text: JSON.stringify(await tool.execute(args)) }],
    }));
  }

  return server;
}

// ── Request handler ──────────────────────────────────────────────────────────

async function handleMcpRequest(request: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });
  const server = createServer();
  await server.connect(transport);

  try {
    return await transport.handleRequest(request);
  } finally {
    await transport.close();
    await server.close();
  }
}

// ── Next.js route exports ────────────────────────────────────────────────────

export async function POST(req: Request) {
  return handleMcpRequest(req);
}

export async function GET(req: Request) {
  return handleMcpRequest(req);
}

export async function DELETE(req: Request) {
  return handleMcpRequest(req);
}
