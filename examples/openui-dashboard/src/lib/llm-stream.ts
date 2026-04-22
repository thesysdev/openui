export type LLMToolCall = { id: string; name: string; status: "calling" | "done"; result?: string };

export async function streamChat(
  endpoint: string,
  messages: Array<{ role: string; content: string }>,
  onChunk: (text: string) => void,
  onDone: (usage?: { prompt_tokens?: number; completion_tokens?: number }) => void,
  onToolCall: (calls: LLMToolCall[]) => void,
  signal?: AbortSignal,
  onFirstChunk?: () => void,
) {
  const activeCalls: LLMToolCall[] = [];
  onToolCall([]);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    onChunk(`Error: ${err}`);
    onDone();
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastUsage: { prompt_tokens?: number; completion_tokens?: number } | undefined;
  let firstChunkFired = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") {
        for (const tc of activeCalls) {
          if (tc.status === "calling") tc.status = "done";
        }
        onToolCall([...activeCalls]);
        if (lastUsage) {
          console.log("[llm] Token usage:", lastUsage);
        }
        onDone(lastUsage);
        return;
      }
      try {
        const chunk = JSON.parse(data);
        const tcDeltas = chunk.choices?.[0]?.delta?.tool_calls;
        if (tcDeltas) {
          for (const tc of tcDeltas) {
            if (tc.id && tc.function?.name) {
              activeCalls.push({ id: tc.id, name: tc.function.name, status: "calling" });
              onToolCall([...activeCalls]);
            } else if (tc.function?.arguments) {
              const existing = activeCalls[tc.index];
              if (existing) {
                existing.status = "done";
                try {
                  const parsed = JSON.parse(tc.function.arguments);
                  if (parsed._response) {
                    existing.result = JSON.stringify(parsed._response).slice(0, 2000);
                  }
                } catch { /* ignore parse errors */ }
                onToolCall([...activeCalls]);
              }
            }
          }
        }
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
          if (!firstChunkFired) { firstChunkFired = true; onFirstChunk?.(); }
          onChunk(content);
        }
        if (chunk.usage) lastUsage = chunk.usage;
      } catch { /* skip malformed chunks */ }
    }
  }
  if (lastUsage) {
    console.log("[llm] Token usage:", lastUsage);
  }
  onDone(lastUsage);
}
