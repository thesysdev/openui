import { z } from "zod/v4";

export const chatRequestSchema = z.strictObject({
  threadId: z.string().min(1).max(200),
  input: z.tuple([
    z.strictObject({
      type: z.literal("message"),
      role: z.literal("user"),
      content: z.string().trim().min(1).max(600),
    }),
  ]),
});

export async function parseChatRequest(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json")
    throw new Error("Send JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Send a question.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16_384) {
        await reader.cancel();
        throw new Error("Request too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return chatRequestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
}
