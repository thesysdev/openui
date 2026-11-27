import {
  Client,
  InMemoryTransport,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { describe, expect, it, vi } from "vitest";
import { defineDashboard } from ".";
import { OpenUIApiError } from "../../core/errors";
import type { CloudApi } from "../../core/http";
import type { DataTool } from "../../interpreter/types";
import type { ArtifactLibrary } from "../types";
import type { DashboardMcpHandler, McpAuthInfo } from "./types";

// The config block is lang-core's; these tests are about the tools around it.
vi.mock("./config", () => ({
  artifactConfig: () => (artifact: unknown) => JSON.stringify(artifact),
}));

type Context = { userId: string };
const context: Context = { userId: "user_1" };

const CLOUD_REPLY = "Sales is building.\n]]>openui:content?artifact_id=art_1&type=dashboard";
const REMINDER = /^Reply to the user in ONE short sentence/;
const DASHBOARD = { name: "Sales", content: 'root = Stack([], "column")', isEditable: true };

const sales: DataTool<Context> = {
  description: "Sales rows",
  parameters: { type: "object", properties: {} },
  execute: async () => [],
};

/** A dashboard on a fake OpenUI Cloud that starts every build, serves art_1, or fails with `failure`. */
function setup(failure?: OpenUIApiError) {
  const bodies: Array<Record<string, unknown>> = [];
  const send = async (method: string, _path: string, { body }: { body?: unknown } = {}) => {
    if (failure) throw failure;
    if (method === "GET") {
      return { id: "art_1", kind: "dashboard", ...DASHBOARD, is_editable: true };
    }
    bodies.push(body as Record<string, unknown>);
    return {
      artifact_id: "art_1",
      choices: [{ message: { role: "assistant", content: CLOUD_REPLY }, finish_reason: "stop" }],
    };
  };
  const dashboard = defineDashboard<Context>({ send } as unknown as CloudApi, {
    library: { components: {} } as unknown as ArtifactLibrary,
    model: "provider/model",
    tools: { sales },
  });
  return { dashboard, bodies };
}

async function connect(transport: unknown) {
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(transport as Parameters<Client["connect"]>[0]);
  return client;
}

const texts = (result: { content?: unknown }) =>
  (result.content as Array<{ type: string; text: string }>).map(({ text }) => text);

describe("dashboard.tools()", () => {
  it("returns the three tools, and create lists the data dashboards can show", async () => {
    const tools = await setup().dashboard.tools(context);
    expect(Object.keys(tools)).toEqual(["create_dashboard", "edit_dashboard", "get_dashboard"]);
    expect(Object.values(tools).map((tool) => tool.name)).toEqual(Object.keys(tools));
    expect(tools.create_dashboard.description).toContain(
      "Dashboards can show this data, and nothing else:\n- sales: Sales rows",
    );
  });

  it("gives a plain JSON Schema that is also a Standard Schema", async () => {
    const { inputSchema } = (await setup().dashboard.tools(context)).create_dashboard;
    const plain = {
      type: "object",
      properties: {
        title: { type: "string", description: expect.any(String) },
        prompt: { type: "string", description: expect.any(String) },
      },
      required: ["title", "prompt"],
      additionalProperties: false,
    };
    // JSON Schema SDKs and providers never see `~standard`.
    expect(JSON.parse(JSON.stringify(inputSchema))).toEqual(plain);

    const standard = inputSchema["~standard"];
    expect(standard.jsonSchema.input({ target: "draft-07" })).toEqual(plain);
    expect(standard.validate({ title: "T", prompt: "  " })).toEqual({
      issues: [{ message: "prompt is required.", path: ["prompt"] }],
    });
    expect(standard.validate({ title: "T", prompt: "P" })).toEqual({
      value: { title: "T", prompt: "P" },
    });
  });

  it("creates as the user, returning OpenUI Cloud's response and then the reply reminder", async () => {
    const { dashboard, bodies } = setup();
    const tools = await dashboard.tools(context);
    const result = await tools.create_dashboard.execute({ title: "Sales", prompt: "By region" });
    const [response, reminder] = result.split("\n\n");
    expect(response).toBe(CLOUD_REPLY);
    expect(reminder).toMatch(REMINDER);
    expect(bodies[0]).toMatchObject({ user_id: "user_1" });
  });

  it("reads a dashboard as JSON with no reminder", async () => {
    const tools = await setup().dashboard.tools(context);
    const result = await tools.get_dashboard.execute({ id: "art_1" });
    expect(JSON.parse(result)).toEqual(DASHBOARD);
  });

  it("finds the user per call from the framework's call context", async () => {
    const { dashboard, bodies } = setup();
    const resolve = vi.fn((callContext: unknown) => ({
      userId: (callContext as { user: string }).user,
    }));
    const tools = await dashboard.tools(resolve);
    await tools.edit_dashboard.execute({ id: "art_1", prompt: "Add a filter" }, { user: "user_2" });
    expect(resolve).toHaveBeenCalledWith({ user: "user_2" });
    expect(bodies[0]).toMatchObject({ user_id: "user_2" });
  });

  it("rejects missing input before calling OpenUI Cloud", async () => {
    const { dashboard, bodies } = setup();
    const tools = await dashboard.tools(context);
    await expect(tools.create_dashboard.execute({ title: "T" })).rejects.toThrow(
      "prompt is required.",
    );
    expect(bodies).toEqual([]);
  });

  it.each([
    [404, "No dashboard with id art_9 that this user can open."],
    [403, "This user can't change that dashboard."],
    [409, "That dashboard is being changed right now."],
    [429, "Too many dashboard requests right now."],
  ])("turns OpenUI Cloud's %i into a sentence the model can act on", async (status, sentence) => {
    const failure = new OpenUIApiError("Refused", "http_error", status);
    const tools = await setup(failure).dashboard.tools(context);
    const call = tools.edit_dashboard.execute({ id: "art_9", prompt: "P" });
    await expect(call).rejects.toThrow(sentence);
    await expect(call).rejects.toMatchObject({ cause: failure });
  });
});

describe("dashboard.mcpHandler(context)", () => {
  async function client(handler: DashboardMcpHandler) {
    return connect(await handler.transport());
  }

  it("lists the tools with plain schemas and hints", async () => {
    const mcp = setup().dashboard.mcpHandler(context);
    const mcpClient = await client(mcp);
    const { tools } = await mcpClient.listTools();
    expect(tools.map((tool) => [tool.name, tool.annotations?.readOnlyHint])).toEqual([
      ["create_dashboard", false],
      ["edit_dashboard", false],
      ["get_dashboard", true],
    ]);
    expect(tools[0]!.inputSchema).toMatchObject({ required: ["title", "prompt"] });
    await mcpClient.close();
    await mcp.close();
  });

  it("puts OpenUI Cloud's response first and the reminder second", async () => {
    const { dashboard, bodies } = setup();
    const mcp = dashboard.mcpHandler(context);
    const mcpClient = await client(mcp);
    const result = await mcpClient.callTool({
      name: "create_dashboard",
      arguments: { title: "Sales", prompt: "By region" },
    });
    expect(result.isError).toBeFalsy();
    const [response, reminder] = texts(result);
    expect(response).toBe(CLOUD_REPLY);
    expect(reminder).toMatch(REMINDER);
    expect(bodies[0]).toMatchObject({ user_id: "user_1" });
    await mcpClient.close();
    await mcp.close();
  });

  it("answers a failed call with an error result the model can read", async () => {
    const mcp = setup(new OpenUIApiError("Not found", "not_found", 404)).dashboard.mcpHandler(
      context,
    );
    const mcpClient = await client(mcp);
    const result = await mcpClient.callTool({ name: "get_dashboard", arguments: { id: "art_9" } });
    expect(result.isError).toBe(true);
    expect(texts(result)[0]).toContain("No dashboard with id art_9 that this user can open.");
    await mcpClient.close();
    await mcp.close();
  });
});

describe("dashboard.mcpHandler(resolve)", () => {
  const post = (handler: DashboardMcpHandler) =>
    handler.fetch(
      new Request(handler.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      }),
    );

  it("answers 401 when resolve finds no user", async () => {
    const response = await post(setup().dashboard.mcpHandler(() => null));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: -32001 } });
  });

  it("sends a Response that resolve throws as it is", async () => {
    const denied = new Response("Forbidden", { status: 403 });
    const mcp = setup().dashboard.mcpHandler(() => {
      throw denied;
    });
    expect(await post(mcp)).toBe(denied);
  });

  it("acts as the user resolve finds from the request and the route's auth", async () => {
    const { dashboard, bodies } = setup();
    const resolve = vi.fn((request: Request, authInfo?: McpAuthInfo) => ({
      userId: `${request.headers.get("x-user")}@${authInfo?.clientId}`,
    }));
    const mcp = dashboard.mcpHandler(resolve);
    // A route that already verified the caller passes its auth along.
    const authInfo: McpAuthInfo = { token: "t", clientId: "app", scopes: [] };
    const transport = new StreamableHTTPClientTransport(new URL(mcp.url), {
      fetch: (url, init) => {
        const request = new Request(url, init);
        request.headers.set("x-user", "user_3");
        return mcp.fetch(request, { authInfo });
      },
    });
    const mcpClient = await connect(transport);
    await mcpClient.callTool({ name: "edit_dashboard", arguments: { id: "art_1", prompt: "P" } });
    expect(resolve).toHaveBeenCalledWith(expect.any(Request), authInfo);
    expect(bodies[0]).toMatchObject({ user_id: "user_3@app" });
    await mcpClient.close();
    await mcp.close();
  });
});

describe("dashboard.mcpServer(context)", () => {
  it("serves the same tools to an SDK that connects the server itself", async () => {
    const server = await setup().dashboard.mcpServer(context);
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.connect(serverSide);
    const mcpClient = await connect(clientSide);
    const result = await mcpClient.callTool({ name: "get_dashboard", arguments: { id: "art_1" } });
    expect(JSON.parse(texts(result)[0]!)).toEqual(DASHBOARD);
    await mcpClient.close();
    await server.close();
  });
});
