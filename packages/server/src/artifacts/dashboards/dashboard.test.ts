import { afterEach, describe, expect, it, vi } from "vitest";
import { defineDashboard } from ".";
import type { CloudApi } from "../../core/http";
import type { DataTool } from "../../interpreter/types";
import type { ArtifactLibrary } from "../types";
import type { Dashboard } from "./types";

// The config block is lang-core's; these tests are about the requests around it.
vi.mock("./config", () => ({
  artifactConfig: () => (artifact: unknown) => JSON.stringify(artifact),
}));

const context = { userId: "user_1", team: "blue" };
type Context = typeof context;
type Message = Record<string, unknown>;

const started = {
  object: "chat.completion",
  choices: [
    {
      index: 0,
      message: { role: "assistant", content: "Dashboard started" },
      finish_reason: "stop",
    },
  ],
  artifact_id: "art_1",
};
const toolCall = (id: string, name: string, args = "{}") => ({
  id,
  type: "function",
  function: { name, arguments: args },
});
const toolCalls = (...calls: unknown[]) => ({
  artifact_id: "art_1",
  choices: [{ message: { role: "assistant", content: null, tool_calls: calls } }],
});
const rounds = (count: number) =>
  Array.from({ length: count }, (_, i) => toolCalls(toolCall(`c${i}`, "sales")));

/** A dashboard on a mocked API that answers each chat POST with the next reply. */
function setup(replies: unknown[], tools: Record<string, DataTool<Context>>) {
  const bodies: Array<{ messages: Message[]; artifact_id?: string }> = [];
  const executes: Array<Record<string, unknown>> = [];
  const send = async (_method: string, path: string, { body }: { body?: unknown } = {}) => {
    if (path === "/v1/frontend-tokens") return { token: "fct_1", expires_at: 1 };
    if (path === "/v1/app/execute") {
      executes.push(body as Record<string, unknown>);
      return { status: "done", result: { revenue: 7 } };
    }
    // Copied, because the messages array grows between requests.
    bodies.push(JSON.parse(JSON.stringify(body)));
    return replies[bodies.length - 1];
  };
  const dashboard = defineDashboard<Context>({ send } as unknown as CloudApi, {
    library: { components: {} } as unknown as ArtifactLibrary,
    model: "provider/model",
    tools,
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
  it("sends the data tools in the config block, not as top-level tools", async () => {
    const bare = { execute: async () => 1 } as unknown as DataTool<Context>;
    const { dashboard, bodies } = setup([started], { sales, bare });
    await create(dashboard);
    expect(bodies[0]).not.toHaveProperty("tools");
    const config = JSON.parse(bodies[0]!.messages[0]!["content"] as string) as {
      tools: Array<{ name: string }>;
    };
    expect(config.tools.map((t) => t.name)).toEqual(["sales", "bare"]);
  });

  it("runs a saved script of the build by the dashboard's id and version, and sends the id back", async () => {
    const reply = {
      ...toolCalls(
        toolCall(
          "c1",
          "openui_create_script",
          '{"name":"revenue","code":"async () => 1","args":{"d":7}}',
        ),
      ),
      artifact_id: "art_build",
      artifact_version: "v_build",
    };
    const { dashboard, bodies, executes } = setup([reply, started], { sales });
    await expect(create(dashboard)).resolves.toBe("Dashboard started");
    expect(executes).toEqual([
      {
        artifact_id: "art_build",
        artifact_version: "v_build",
        user_id: "user_1",
        name: "revenue",
        arguments: { d: 7 },
        tool_results: [],
      },
    ]);
    expect(bodies[0]).not.toHaveProperty("artifact_id");
    expect(bodies[1]!.artifact_id).toBe("art_build");
    // OpenUI Cloud holds the build's turns: only the new results go back.
    expect(bodies[1]!.messages).toEqual([
      { role: "tool", tool_call_id: "c1", content: '{"revenue":7}' },
    ]);
    expect(sales.execute).not.toHaveBeenCalled();
  });

  it("streams: the started message at once, the round's calls run, then how it ended", async () => {
    const chunk = (delta: unknown, finish: string | null = null) => ({
      artifact_id: "art_1",
      choices: [{ index: 0, delta, finish_reason: finish }],
    });
    const streams = [
      [
        chunk({ role: "assistant", content: "Started ref" }),
        chunk({ tool_calls: [{ index: 0, ...toolCall("c1", "sales", '{"region":"EU"}') }] }),
        chunk({}, "tool_calls"),
      ],
      [{ artifact_id: "art_1", choices: [] }, chunk({ content: "Created ref" }), chunk({}, "stop")],
    ];
    const bodies: Array<Record<string, unknown>> = [];
    const api = {
      send: async () => ({}),
      async *stream(_path: string, body: unknown) {
        bodies.push(JSON.parse(JSON.stringify(body)));
        yield* streams[bodies.length - 1]!;
      },
    };
    const dashboard = defineDashboard<Context>(api as unknown as CloudApi, {
      library: { components: {} } as unknown as ArtifactLibrary,
      model: "provider/model",
      tools: { sales },
    });
    const messages: string[] = [];
    for await (const message of dashboard.create({ title: "T", prompt: "P" }, context, {
      stream: true,
    })) {
      messages.push(message);
    }
    expect(messages).toEqual(["Started ref", "Created ref"]);
    expect(bodies[1]).toMatchObject({
      artifact_id: "art_1",
      messages: [{ role: "tool", tool_call_id: "c1" }],
    });
    expect(sales.execute).toHaveBeenCalledWith({ region: "EU" }, context, expect.anything());
  });

  it("without stream, still resolves with the started message", async () => {
    const { dashboard } = setup([started], { sales });
    await expect(create(dashboard)).resolves.toBe("Dashboard started");
  });

  it("runs the model's tool calls and sends the results back in order", async () => {
    const reply = toolCalls(
      toolCall("c1", "sales", '{"region":"EU"}'),
      toolCall("c2", "sales", "{}"),
    );
    const { dashboard, bodies } = setup([reply, started], { sales });
    await expect(create(dashboard)).resolves.toBe("Dashboard started");

    const options = { signal: expect.any(AbortSignal) };
    expect(sales.execute).toHaveBeenNthCalledWith(1, { region: "EU" }, context, options);
    expect(sales.execute).toHaveBeenNthCalledWith(2, {}, context, options);
    // OpenUI Cloud keeps the build's turns: only the new results go back.
    expect(bodies[1]!.messages).toEqual([
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
    );
    const { dashboard, bodies } = setup([reply, started], { sales, broken });
    await expect(create(dashboard)).resolves.toBe("Dashboard started");

    const results = bodies[1]!.messages;
    expect(JSON.parse(results[0]!["content"] as string)).toEqual({
      error: { code: "tool_exec_error", message: "x".repeat(20_000) },
    });
    expect(results.slice(1).map(error)).toEqual(["tool_not_found", "bad_args"]);
    expect(sales.execute).not.toHaveBeenCalled();
  });

  it("sends a large result back as it is, and an unserializable one as an error", async () => {
    const rows = Array.from({ length: 500 }, (_, i) => ({ id: i, note: "x".repeat(400) }));
    const reply = toolCalls(toolCall("c1", "big"), toolCall("c2", "bigint"));
    const tools = { big: tool(async () => rows), bigint: tool(async () => ({ id: 1n })) };
    const { dashboard, bodies } = setup([reply, started], tools);
    await expect(create(dashboard)).resolves.toBe("Dashboard started");
    expect(bodies[1]!.messages[0]!["content"]).toBe(JSON.stringify(rows));
    expect(error(bodies[1]!.messages[1])).toBe("tool_exec_error");
  });

  it("keeps going for as many rounds as the model asks", async () => {
    const { dashboard, bodies } = setup([...rounds(12), started], { sales });
    await expect(create(dashboard)).resolves.toBe("Dashboard started");
    expect(bodies).toHaveLength(13);
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
    expect(bodies[1]!.messages.map(error)).toEqual(["tool_timeout", undefined]);
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

  it("fails on any other reply", async () => {
    const text = { choices: [{ message: { role: "assistant", content: "hi" } }] };
    const failure = { code: "invalid_response", status: 502 };
    await expect(create(setup([text], { sales }).dashboard)).rejects.toMatchObject(failure);
    expect(sales.execute).not.toHaveBeenCalled();
  });
});
