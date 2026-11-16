import { afterEach, describe, expect, it, vi } from "vitest";
import type { DataTool } from "../tools/types";
import type { CloudApi } from "./api";
import { defineDashboard } from "./dashboard";
import type { ArtifactLibrary, Dashboard } from "./types";

// The config block is lang-core's; these tests are about the requests around it.
vi.mock("./config", () => ({
  artifactConfig: () => (artifact: unknown) => JSON.stringify(artifact),
}));

const context = { userId: "user_1", team: "blue" };
type Context = typeof context;
type Message = Record<string, unknown>;

const started = { response: "Dashboard started" };
const toolCall = (id: string, name: string, args = "{}") => ({
  id,
  type: "function",
  function: { name, arguments: args },
});
const toolCalls = (...calls: unknown[]) => ({
  choices: [{ message: { role: "assistant", content: null, tool_calls: calls } }],
});
const rounds = (count: number) =>
  Array.from({ length: count }, (_, i) => toolCalls(toolCall(`c${i}`, "sales")));

/** A dashboard on a mocked API that answers each chat POST with the next reply. */
function setup(replies: unknown[], tools: Record<string, DataTool<Context>>, probe?: boolean) {
  const bodies: Array<{ messages: Message[]; tools?: unknown[]; draft_id?: string }> = [];
  const executes: Array<Record<string, unknown>> = [];
  const post = async (path: string, body: unknown) => {
    if (path === "/v1/frontend-tokens") return { token: "fct_1", expires_at: 1 };
    if (path === "/v1/app/execute") {
      executes.push(body as Record<string, unknown>);
      return { status: "done", result: { revenue: 7 } };
    }
    // Copied, because the messages array grows between requests.
    bodies.push(JSON.parse(JSON.stringify(body)));
    return replies[bodies.length - 1];
  };
  const dashboard = defineDashboard<Context>({ post } as unknown as CloudApi, {
    library: { components: {} } as unknown as ArtifactLibrary,
    model: "provider/model",
    tools,
    probe,
  });
  return { dashboard, bodies, executes };
}

const create = (dashboard: Dashboard<Context>, signal?: AbortSignal) =>
  dashboard.create({ title: "T", prompt: "P" }, context, { signal });

const sales: DataTool<Context> = {
  description: "Sales rows",
  parameters: { type: "object", properties: { region: { type: "string" } } },
  execute: vi.fn(async () => [{ region: "EU", total: 10 }]),
};
const tool = (execute: () => unknown) => ({ parameters: {}, execute }) as DataTool<Context>;

const error = (message: Message | undefined) =>
  (JSON.parse(message?.["content"] as string) as { error?: { code: string } }).error?.code;

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("defineDashboard create", () => {
  it("sends no tools and posts once when probe is off", async () => {
    const { dashboard, bodies } = setup([started], { sales }, false);
    await expect(create(dashboard)).resolves.toBe("Dashboard started");
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).not.toHaveProperty("tools");
  });

  it("sends the data tools as function tools by default", async () => {
    const bare = { execute: async () => 1 } as unknown as DataTool<Context>;
    const { dashboard, bodies } = setup([started], { sales, bare });
    await create(dashboard);
    expect(bodies[0]!.tools).toEqual([
      {
        type: "function",
        function: { name: "sales", description: "Sales rows", parameters: sales.parameters },
      },
      {
        type: "function",
        function: { name: "bare", parameters: { type: "object", properties: {} } },
      },
      {
        type: "function",
        function: { name: "create_script", parameters: { type: "object", properties: {} } },
      },
    ]);
  });

  it("leaves create_script out when one of your tools has that name", async () => {
    const { dashboard, bodies } = setup([started], { create_script: sales });
    await create(dashboard);
    expect(bodies[0]!.tools).toHaveLength(1);
  });

  it("runs a saved script through OpenUI Cloud by the build's draft_id, and sends the id back", async () => {
    const reply = {
      ...toolCalls(
        toolCall("c1", "create_script", '{"name":"revenue","code":"async () => 1","args":{"d":7}}'),
      ),
      draft_id: "art_build",
    };
    const { dashboard, bodies, executes } = setup([reply, started], { sales });
    await expect(create(dashboard)).resolves.toBe("Dashboard started");
    expect(executes).toEqual([
      {
        draft_id: "art_build",
        user_id: "user_1",
        name: "revenue",
        arguments: { d: 7 },
        tool_results: [],
      },
    ]);
    expect(bodies[0]).not.toHaveProperty("draft_id");
    expect(bodies[1]!.draft_id).toBe("art_build");
    expect(bodies[1]!.messages[3]).toEqual({
      role: "tool",
      tool_call_id: "c1",
      content: '{"revenue":7}',
    });
    expect(sales.execute).not.toHaveBeenCalled();
  });

  it("runs the model's tool calls and sends the results back in order", async () => {
    const reply = toolCalls(
      toolCall("c1", "sales", '{"region":"EU"}'),
      toolCall("c2", "sales", " "),
    );
    const { dashboard, bodies } = setup([reply, started], { sales });
    await expect(create(dashboard)).resolves.toBe("Dashboard started");

    const options = { signal: expect.any(AbortSignal) };
    expect(sales.execute).toHaveBeenNthCalledWith(1, { region: "EU" }, context, options);
    expect(sales.execute).toHaveBeenNthCalledWith(2, {}, context, options);
    expect(bodies[1]!.messages).toEqual([
      ...bodies[0]!.messages,
      reply.choices[0]!.message,
      { role: "tool", tool_call_id: "c1", content: '[{"region":"EU","total":10}]' },
      { role: "tool", tool_call_id: "c2", content: '[{"region":"EU","total":10}]' },
    ]);
  });

  it("answers failing, unknown and badly called tools with an error and still resolves", async () => {
    const broken = tool(async () => {
      throw new Error("x".repeat(20_000));
    });
    const reply = toolCalls(
      toolCall("c1", "broken"),
      toolCall("c2", "missing"),
      toolCall("c3", "sales", "[1]"),
      toolCall("c4", "sales", "{not json"),
    );
    const { dashboard, bodies } = setup([reply, started], { sales, broken });
    await expect(create(dashboard)).resolves.toBe("Dashboard started");

    const results = bodies[1]!.messages.slice(3);
    expect(JSON.parse(results[0]!["content"] as string)).toEqual({
      error: { code: "tool_exec_error", message: "x".repeat(500) },
    });
    expect(results.slice(1).map(error)).toEqual(["tool_not_found", "bad_args", "bad_args"]);
    expect(sales.execute).not.toHaveBeenCalled();
  });

  it("sends a large result back as it is, and an unserializable one as an error", async () => {
    const rows = Array.from({ length: 500 }, (_, i) => ({ id: i, note: "x".repeat(400) }));
    const reply = toolCalls(toolCall("c1", "big"), toolCall("c2", "bigint"));
    const tools = { big: tool(async () => rows), bigint: tool(async () => ({ id: 1n })) };
    const { dashboard, bodies } = setup([reply, started], tools);
    await expect(create(dashboard)).resolves.toBe("Dashboard started");
    expect(bodies[1]!.messages[3]!["content"]).toBe(JSON.stringify(rows));
    expect(error(bodies[1]!.messages[4])).toBe("tool_exec_error");
  });

  it("keeps sending the same tools for as many rounds as the model asks", async () => {
    const { dashboard, bodies } = setup([...rounds(12), started], { sales });
    await expect(create(dashboard)).resolves.toBe("Dashboard started");
    expect(bodies).toHaveLength(13);
    for (const body of bodies) expect(body.tools).toEqual(bodies[0]!.tools);
    expect(sales.execute).toHaveBeenCalledTimes(12);
  });

  it("answers tools still running after 60 seconds with a timeout and continues", async () => {
    vi.useFakeTimers();
    const slow = tool(() => new Promise(() => {}));
    const reply = toolCalls(toolCall("c1", "slow"), toolCall("c2", "sales"));
    const { dashboard, bodies } = setup([reply, started], { slow, sales });
    const created = create(dashboard);
    await vi.advanceTimersByTimeAsync(60_000);
    await expect(created).resolves.toBe("Dashboard started");
    expect(bodies[1]!.messages.slice(3).map(error)).toEqual(["tool_timeout", undefined]);
  });

  it("rejects when the caller aborts while a tool runs", async () => {
    const controller = new AbortController();
    const slow = tool(() => {
      controller.abort(new Error("cancelled"));
      return new Promise(() => {});
    });
    const { dashboard, bodies } = setup([toolCalls(toolCall("c1", "slow")), started], { slow });
    await expect(create(dashboard, controller.signal)).rejects.toThrow("cancelled");
    expect(bodies).toHaveLength(1);
  });

  it("fails on any other reply, and on tool calls when probe is off", async () => {
    const text = { choices: [{ message: { role: "assistant", content: "hi" } }] };
    const failure = { code: "invalid_response", status: 502 };
    await expect(create(setup([text], { sales }).dashboard)).rejects.toMatchObject(failure);
    await expect(create(setup(rounds(1), { sales }, false).dashboard)).rejects.toMatchObject(
      failure,
    );
    expect(sales.execute).not.toHaveBeenCalled();
  });
});
