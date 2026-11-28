import { OpenUIApiError } from "../../core/errors";
import {
  assertUserIdRequired,
  type ExecutionContext,
  type ToolDefinition,
} from "../../interpreter/types";
import { explain, mcpToolList, runTool, SERVER_INSTRUCTIONS } from "./dashboard-tools";
import type {
  Dashboard,
  DashboardMcpHandler,
  DashboardMcpServer,
  McpAuthInfo,
  McpClientTransport,
  McpFetch,
  McpResolve,
} from "./types";

/** Never contacted: `fetch` answers in memory. */
const PLACEHOLDER_URL = "http://openui.invalid/mcp";
/** Carries the user from `fetch` to the server factory. */
const CONTEXT_KEY = "openui.context";

// The parts of MCP SDK v2 used here, so the package doesn't depend on it.
interface ServerSdk {
  McpServer: new (
    info: { name: string; title: string; version: string },
    options: { capabilities: { tools: object }; instructions: string },
  ) => DashboardMcpServer & {
    server: {
      setRequestHandler(
        method: "tools/list" | "tools/call",
        handler: (
          request: { params: { name: string; arguments?: Record<string, unknown> } },
          ctx: { mcpReq: { signal: AbortSignal } },
        ) => Promise<unknown>,
      ): void;
    };
  };
  createMcpHandler(factory: (ctx: { authInfo?: McpAuthInfo }) => Promise<DashboardMcpServer>): {
    fetch(request: Request, options?: { authInfo?: McpAuthInfo }): Promise<Response>;
    close(): Promise<void>;
  };
}
interface ClientSdk {
  StreamableHTTPClientTransport: new (url: URL, options: { fetch: McpFetch }) => McpClientTransport;
}

// Optional peers. A variable specifier keeps TypeScript and app bundlers from resolving them.
const loaded = new Map<string, Promise<unknown>>();
function load<T>(name: string): Promise<T> {
  let module = loaded.get(name);
  if (!module) {
    module = import(/* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ name);
    module.catch(() => loaded.delete(name));
    loaded.set(name, module);
  }
  return (module as Promise<T>).catch(() => {
    throw new OpenUIApiError(
      `Dashboards over MCP need ${name}: install it with your package manager`,
      "missing_dependency",
    );
  });
}

type Core<Context extends ExecutionContext> = Pick<Dashboard<Context>, "create" | "edit" | "get">;

/** The tools as an MCP server for one user. */
export async function dashboardMcpServer<Context extends ExecutionContext>(
  dashboard: Core<Context>,
  data: () => Promise<ToolDefinition[]>,
  context: Context,
): Promise<DashboardMcpServer> {
  assertUserIdRequired(context);
  const { McpServer } = await load<ServerSdk>("@modelcontextprotocol/server");
  const server = new McpServer(
    { name: "openui-dashboards", title: "OpenUI Dashboards", version: "1.0.0" },
    { capabilities: { tools: {} }, instructions: SERVER_INSTRUCTIONS },
  );
  const tools = await mcpToolList(data);

  // Plain JSON schemas, so no zod: what `registerTool` installs underneath.
  server.server.setRequestHandler("tools/list", async () => ({ tools }));
  server.server.setRequestHandler("tools/call", async ({ params }, ctx) => {
    const { name, arguments: input = {} } = params;
    try {
      const { text, reminder } = await runTool(dashboard, name, input, context, ctx.mcpReq.signal);
      // The renderer reads content[0].
      return {
        content: [{ type: "text", text }, ...(reminder ? [{ type: "text", text: reminder }] : [])],
      };
    } catch (error) {
      return { content: [{ type: "text", text: explain(error, name, input) }], isError: true };
    }
  });
  return server;
}

/** The tools over Streamable HTTP: a server per request, for a fixed or resolved user. */
export function dashboardMcpHandler<Context extends ExecutionContext>(
  dashboard: Core<Context>,
  data: () => Promise<ToolDefinition[]>,
  user: Context | McpResolve<Context>,
): DashboardMcpHandler {
  const resolve = typeof user === "function" ? user : undefined;
  if (!resolve) assertUserIdRequired(user);

  let inner: ReturnType<ServerSdk["createMcpHandler"]> | undefined;
  const handler = async () =>
    (inner ??= (await load<ServerSdk>("@modelcontextprotocol/server")).createMcpHandler((ctx) =>
      dashboardMcpServer(dashboard, data, ctx.authInfo?.extra?.[CONTEXT_KEY] as Context),
    ));

  // Fits an MCP client's `fetch(url, init)` and a route's `(request, routeContext)`.
  const fetch: McpFetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init as RequestInit);
    const upstream =
      input instanceof Request
        ? (init as { authInfo?: McpAuthInfo } | undefined)?.authInfo
        : undefined;

    let context: Context | null = resolve ? null : (user as Context);
    if (resolve) {
      try {
        context = await resolve(request, upstream);
      } catch (thrown) {
        if (thrown instanceof Response) return thrown;
        throw thrown;
      }
      if (!context) {
        return Response.json(
          { jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized" }, id: null },
          { status: 401 },
        );
      }
    }
    const authInfo: McpAuthInfo = {
      token: "",
      clientId: "openui",
      scopes: [],
      ...upstream,
      extra: { ...upstream?.extra, [CONTEXT_KEY]: context },
    };
    return (await handler()).fetch(request, { authInfo });
  };

  return {
    url: PLACEHOLDER_URL,
    fetch,
    async transport() {
      const { StreamableHTTPClientTransport } = await load<ClientSdk>(
        "@modelcontextprotocol/client",
      );
      return new StreamableHTTPClientTransport(new URL(PLACEHOLDER_URL), { fetch });
    },
    async close() {
      await inner?.close();
    },
  };
}
