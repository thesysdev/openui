import type { McpClientLike } from "@openuidev/react-lang";

export type ToolCallEntry = { tool: string; status: "pending" | "done" | "error" };

export function wrapMcpClient(
  client: McpClientLike,
  onToolCall: (calls: ToolCallEntry[]) => void,
): McpClientLike {
  const activeCalls: ToolCallEntry[] = [];
  return {
    ...client,
    callTool: async (params, options) => {
      const entry: ToolCallEntry = { tool: params.name, status: "pending" };
      activeCalls.push(entry);
      onToolCall([...activeCalls]);
      try {
        const result = await client.callTool(params, options);
        entry.status = "done";
        onToolCall([...activeCalls]);
        return result;
      } catch (err) {
        entry.status = "error";
        onToolCall([...activeCalls]);
        throw err;
      }
    },
  };
}
