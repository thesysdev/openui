import { describe, expect, it, vi } from "vitest";
import { caught, fakeFetch, json, type SentRequest } from "../__tests__/fake-fetch";
import { createCloudApi } from "../core/http";
import { createInterpreter, dataToolLoader, toToolDefinitions } from "./execute";
import type { DataTool, ExecutionContext } from "./types";

const context = { userId: "u1", groupIds: ["g1"] };

/** An interpreter on a fake OpenUI Cloud that answers each script round with the next reply. */
function setup(replies: unknown[] = [], tools: Record<string, DataTool> = {}) {
  const { fetch, requests } = fakeFetch(() => json(replies.shift() ?? {}));
  const api = createCloudApi({ apiKey: "k", fetch, appId: "app_1" });
  return { interpreter: createInterpreter(api, async () => tools), requests };
}

const sales = (): DataTool => ({
  parameters: { type: "object" },
  execute: vi.fn(async (args: Record<string, unknown>) => ({ total: 3, ...args })),
});

describe("interpreter.execute", () => {
  it("runs your tool with its arguments, the context and a signal", async () => {
    const tool = sales();
    const { interpreter, requests } = setup([], { sales: tool });
    expect(
      await interpreter.execute({ name: "sales", arguments: { region: "EU" } }, context),
    ).toEqual({ total: 3, region: "EU" });
    expect(tool.execute).toHaveBeenCalledWith({ region: "EU" }, context, {
      signal: expect.any(AbortSignal),
    });
    expect(requests).toHaveLength(0);
  });

  it("runs a saved script as the user, feeding its tool calls back until it's done", async () => {
    const tool = sales();
    const { interpreter, requests } = setup(
      [
        {
          status: "tool_calls",
          state: "s1",
          calls: [{ call_id: "c1", name: "sales", arguments: '{"region":"EU"}' }],
        },
        { status: "done", result: { rows: 1 } },
      ],
      { sales: tool },
    );
    const result = await interpreter.execute(
      { name: "revenue", arguments: { q: 3 }, id: "art_1", version: "v2" },
      context,
    );
    expect(result).toEqual({ rows: 1 });
    const bodies = requests.map((r: SentRequest) => r.body);
    expect(requests[0]!.url.pathname).toBe("/v1/app/execute");
    expect(bodies[0]).toEqual({
      artifact_id: "art_1",
      artifact_version: "v2",
      user_id: "u1",
      group_ids: ["g1"],
      app_id: "app_1",
      name: "revenue",
      arguments: { q: 3 },
      tool_results: [],
    });
    expect(bodies[1]).toMatchObject({
      state: "s1",
      tool_results: [
        { type: "function_call_output", call_id: "c1", output: '{"total":3,"region":"EU"}' },
      ],
    });
  });

  it("answers a failing tool call with its error and keeps going", async () => {
    const broken: DataTool = {
      parameters: {},
      execute: async () => {
        throw new Error("db down");
      },
    };
    const { interpreter, requests } = setup(
      [
        {
          status: "tool_calls",
          state: "s1",
          calls: [{ call_id: "c1", name: "broken", arguments: "{}" }],
        },
        { status: "done", result: null },
      ],
      { broken },
    );
    await interpreter.execute({ name: "q", id: "art_1" }, context);
    expect((requests[1]!.body as { tool_results: unknown[] }).tool_results).toEqual([
      { call_id: "c1", error: { code: "tool_exec_error", message: "db down" } },
    ]);
  });

  it("surfaces a failed script as a 502 with its code", async () => {
    const { interpreter } = setup([
      { status: "error", error: { code: "script_error", message: "boom" } },
    ]);
    expect(
      await caught(() => interpreter.execute({ name: "q", id: "art_1" }, context)),
    ).toMatchObject({
      name: "ToolExecutionError",
      code: "script_error",
      message: "boom",
      status: 502,
    });
  });

  it.each([
    ["an unknown tool without an artifact id", { name: "nope" }, context, "tool_not_found"],
    ["a context without a user", { name: "sales" }, { userId: "" }, "invalid_input"],
    ["a call without a name", { name: "" }, context, "invalid_input"],
  ])("rejects %s", async (_, request, ctx, code) => {
    const { interpreter, requests } = setup([], { sales: sales() });
    expect(await caught(() => interpreter.execute(request, ctx as ExecutionContext))).toMatchObject(
      { name: "ToolExecutionError", code },
    );
    expect(requests).toHaveLength(0);
  });

  it("rejects a malformed script reply", async () => {
    const { interpreter } = setup([{ status: "tool_calls", state: "s1", calls: [] }]);
    expect(
      await caught(() => interpreter.execute({ name: "q", id: "art_1" }, context)),
    ).toMatchObject({ code: "invalid_response", status: 502 });
  });
});

describe("toToolDefinitions", () => {
  it("keeps what generation sees and drops execute", () => {
    const definitions = toToolDefinitions({
      sales: { description: "Sales", parameters: { type: "object" }, output: { total: 1 } },
      bare: { parameters: {} },
    });
    expect(definitions).toEqual([
      { name: "sales", description: "Sales", parameters: { type: "object" }, output: { total: 1 } },
      { name: "bare", parameters: {} },
    ]);
  });
});

describe("dataToolLoader", () => {
  it("needs tools, an MCP server, or both", () => {
    expect(() => dataToolLoader({} as never)).toThrow("Pass `tools`, `mcp`, or both");
  });
});
