import type { StreamProtocolAdapter } from "@openuidev/react-headless";

/** Surface provider error frames that the published completion adapters ignore. */
export function withStreamErrors(adapter: StreamProtocolAdapter): StreamProtocolAdapter {
  return {
    async *parse(response) {
      if (!response.body) throw new Error("Chat response has no body");
      const decoder = new TextDecoder();
      let pending = "";
      function check(line: string) {
        const data = line.startsWith("data:") ? line.slice(5).trim() : line.trim();
        if (!data || data === "[DONE]") return;
        let value;
        try {
          value = JSON.parse(data);
        } catch {
          return;
        }
        if (value.error) {
          throw new Error(
            typeof value.error === "string"
              ? value.error
              : value.error.message || "Model request failed",
          );
        }
      }
      const body = response.body.pipeThrough(
        new TransformStream<Uint8Array, Uint8Array>({
          transform(chunk, controller) {
            pending += decoder.decode(chunk, { stream: true });
            const lines = pending.split("\n");
            pending = lines.pop() ?? "";
            for (const line of lines) check(line);
            controller.enqueue(chunk);
          },
          flush() {
            check(pending + decoder.decode());
          },
        }),
      );
      yield* adapter.parse(new Response(body, { headers: response.headers }));
    },
  };
}
