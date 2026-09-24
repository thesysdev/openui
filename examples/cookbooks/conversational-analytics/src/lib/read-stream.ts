export async function readDashboardStream(
  body: ReadableStream<Uint8Array>,
  onText: (text: string) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";
  let complete = false;
  const consume = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === "error") throw new Error(event.message);
    if (event.type === "done") complete = true;
    if (event.type === "delta" && typeof event.text === "string") {
      output += event.text;
      if (output.length > 80000)
        throw new Error("The dashboard response was too large. Try a narrower question.");
      onText(output);
    }
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      if (buffer.length > 160000) throw new Error("Invalid dashboard stream.");
      const lines = buffer.split("\n");
      buffer = lines.pop()!;
      lines.forEach(consume);
      if (done) break;
    }
    consume(buffer);
    if (!complete || !output.trim())
      throw new Error("Generation ended before a complete dashboard arrived. Try again.");
    return output;
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
