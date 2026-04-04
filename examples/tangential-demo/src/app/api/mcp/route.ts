import { tools } from "@/tools";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

function createServer(): McpServer {
  const server = new McpServer({ name: "tangential-tools", version: "1.0.0" });

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args) => {
        console.log(`[mcp] tool="${tool.name}" args=`, JSON.stringify(args));
        const result = await tool.execute(args);
        const text = JSON.stringify(result);
        console.log(`[mcp] tool="${tool.name}" result length=${text.length}`);
        return { content: [{ type: "text" as const, text }] };
      },
    );
  }

  return server;
}

async function handleMcpRequest(request: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
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

export async function POST(req: Request) {
  return handleMcpRequest(req);
}

export async function GET(req: Request) {
  return handleMcpRequest(req);
}

export async function DELETE(req: Request) {
  return handleMcpRequest(req);
}
