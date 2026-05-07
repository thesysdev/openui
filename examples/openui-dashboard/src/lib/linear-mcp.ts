/**
 * Linear hosted MCP — https://mcp.linear.app/mcp
 * Auth: Authorization: Bearer <API key or OAuth access token>
 * (see https://linear.app/docs/mcp)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export const LINEAR_MCP_URL = "https://mcp.linear.app/mcp";

/** Personal API key, OAuth access token, or restricted key — never expose to the browser. */
export function getLinearBearerToken(): string | undefined {
  return process.env.LINEAR_API_KEY ?? process.env.LINEAR_TOKEN ?? process.env.LINEAR_OAUTH_TOKEN;
}

export async function createConnectedLinearMcpClient(): Promise<Client> {
  const token = getLinearBearerToken();
  if (!token) {
    throw new Error("Set LINEAR_API_KEY (or LINEAR_TOKEN / LINEAR_OAUTH_TOKEN) for Linear MCP.");
  }
  const client = new Client({ name: "openui-dashboard", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(LINEAR_MCP_URL), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  await client.connect(transport);
  return client;
}
