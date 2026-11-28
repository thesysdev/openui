import { describe, expect, it, vi } from "vitest";
import { caught } from "../__tests__/fake-fetch";
import { mcpServers, mcpToolLoader, mergeTools, type McpTool, type McpToolClient } from "./mcp";

const context = { userId: "u1" };
const options = { signal: new AbortController().signal };

const tool = (name: string, readOnly = true, required: string[] = []): McpTool => ({
  name,
  description: `${name} tool`,
  inputSchema: { type: "object", properties: {}, required },
  annotations: { readOnlyHint: readOnly },
});

/** An MCP client listing `pages` of tools, whose calls answer with `result`. */
function client(pages: McpTool[][], result: object = { content: [] }) {
  return {
    listTools: vi.fn(async (params?: { cursor?: string }) => {
      const index = params?.cursor ? Number(params.cursor) : 0;
      return {
        tools: pages[index]!,
        ...(index + 1 < pages.length && { nextCursor: String(index + 1) }),
      };
    }),
    callTool: vi.fn(async () => result),
  } satisfies McpToolClient;
}

describe("mcpToolLoader", () => {
  it("offers the read-only tools by default, across pages, with names generation accepts", async () => {
    const mcp = client([[tool("get-sales.v2"), tool("delete_row", false)], [tool("1report")]]);
    const tools = await mcpToolLoader(mcp)();
    expect(Object.keys(tools)).toEqual(["get_sales_v2", "_1report"]);
    expect(tools["get_sales_v2"]).toMatchObject({ description: "get-sales.v2 tool" });
  });

  it("offers the tools `include` picks, with their example outputs", async () => {
    const mcp = client([[tool("a"), tool("b", false)]]);
    const tools = await mcpToolLoader({
      client: mcp,
      include: ["b"],
      outputs: { b: { rows: [] } },
    })();
    expect(Object.keys(tools)).toEqual(["b"]);
    expect(tools["b"]!.output).toEqual({ rows: [] });
  });

  it("calls through connect(context), dropping empty optional arguments", async () => {
    const perUser = client([[tool("q", true, ["region"])]], { structuredContent: { total: 2 } });
    const connect = vi.fn(() => perUser);
    const tools = await mcpToolLoader({
      client: client([[tool("q", true, ["region"])]]),
      connect,
    })();
    const result = await tools["q"]!.execute(
      { region: "", year: "", month: null, day: 3 },
      context,
      options,
    );
    expect(result).toEqual({ total: 2 });
    expect(connect).toHaveBeenCalledWith(context);
    expect(perUser.callTool).toHaveBeenCalledWith(
      { name: "q", arguments: { region: "", day: 3 } },
      undefined,
      options,
    );
  });

  it.each([
    [{ content: [{ type: "text", text: '{"a":1}' }] }, { a: 1 }],
    [{ content: [{ type: "text", text: "plain" }] }, "plain"],
    [{ toolResult: 7 }, 7],
  ])("reads the result %j", async (raw, expected) => {
    const tools = await mcpToolLoader(client([[tool("q")]], raw))();
    expect(await tools["q"]!.execute({}, context, options)).toEqual(expected);
  });

  it("throws the tool's text when the call reports an error", async () => {
    const tools = await mcpToolLoader(
      client([[tool("q")]], { isError: true, content: [{ type: "text", text: "no access" }] }),
    )();
    expect(await caught(() => tools["q"]!.execute({}, context, options))).toMatchObject({
      name: "ToolExecutionError",
      code: "tool_exec_error",
      message: "no access",
    });
  });

  it("retries a failed listing on the next call", async () => {
    const mcp = client([[tool("q")]]);
    mcp.listTools.mockRejectedValueOnce(new Error("offline"));
    const load = mcpToolLoader(mcp);
    expect(await caught(load)).toMatchObject({ code: "mcp_error", status: 502 });
    expect(Object.keys(await load())).toEqual(["q"]);
  });

  it.each([
    [undefined, "The MCP server marks no tools read-only: pick them with `include`"],
    [["missing"], "No MCP tools match `include`"],
  ])("rejects a server with nothing to offer (include %j)", async (include, message) => {
    const mcp = client([[tool("w", false)]]);
    expect(await caught(mcpToolLoader({ client: mcp, include }))).toMatchObject({
      code: "invalid_tools",
      message,
    });
  });

  it("rejects an option that isn't an MCP client", () => {
    expect(() => mcpToolLoader({} as never)).toThrow(
      "mcp takes an MCP client, or { client } with one",
    );
  });
});

describe("mergeTools and mcpServers", () => {
  it("refuses two data tools with one name", () => {
    expect(() => mergeTools({ sales: 1 }, { sales: 2 })).toThrow(
      "Two data tools are named sales: rename yours or leave an MCP one out",
    );
    expect(mergeTools({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it("takes none, one or several servers", () => {
    const mcp = client([]);
    expect(mcpServers(undefined)).toEqual([]);
    expect(mcpServers(mcp)).toEqual([mcp]);
    expect(mcpServers([mcp, mcp])).toHaveLength(2);
  });
});
