import { expect, it } from "vitest";
import type { CloudApi } from "../client/api";
import { createInterpreter } from "./execute";
import type { DataTool, ExecutionContext } from "./types";

/** OpenUI Cloud running a script that asks for `perRound[i]` tool calls in round i, then finishes. */
function cloud(perRound: number[]): CloudApi {
  let round = 0;
  return {
    async post() {
      const calls = perRound[round++];
      if (calls === undefined) return { status: "done", result: { ok: true } };
      return {
        status: "tool_calls",
        state: `state-${round}`,
        calls: Array.from({ length: calls }, (_, i) => ({
          type: "function_call",
          call_id: `call-${round}-${i}`,
          name: "sales",
          arguments: "{}",
        })),
      };
    },
  };
}

const tools = async () =>
  ({ sales: { execute: async () => ({ total: 1 }) } }) as unknown as Record<
    string,
    DataTool<ExecutionContext>
  >;

const run = (perRound: number[]) =>
  createInterpreter(cloud(perRound), tools).execute(
    { name: "totals", id: "art_1" },
    { userId: "user_1" },
  );

it("runs a script that makes 48 tool calls", async () => {
  await expect(run([16, 16, 16])).resolves.toEqual({ ok: true });
  await expect(run([48])).resolves.toEqual({ ok: true });
});

it("stops a script that asks for a 49th tool call", async () => {
  await expect(run([48, 1])).rejects.toMatchObject({ code: "script_limit" });
  await expect(run([49])).rejects.toMatchObject({ code: "script_limit" });
});

it("allows 8 rounds of tool calls, not 9", async () => {
  await expect(run(Array(8).fill(1))).resolves.toEqual({ ok: true });
  await expect(run(Array(9).fill(1))).rejects.toMatchObject({ code: "script_limit" });
});
