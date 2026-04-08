import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import solid from "vite-plugin-solid";

const SYSTEM_PROMPT = readFileSync(resolve(process.cwd(), "generated/system-prompt.txt"), "utf-8");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      solid(),
      {
        name: "chat-api",
        configureServer(server) {
          server.middlewares.use("/api/chat", async (req, res) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end("Method Not Allowed");
              return;
            }

            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }

            let message = "";
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
              message = String(body.message || "");
            } catch {
              message = "";
            }

            const baseUrl = env["OPENAI_BASE_URL"] || "http://localhost:11434/v1";
            const apiKey = env["OPENAI_API_KEY"] || "ollama";
            const model = env["OPENAI_MODEL"] || "llama3.1:8b";

            try {
              const llmResp = await fetch(`${baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model,
                  messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: message },
                  ],
                  temperature: 0.5,
                  top_p: 0.9,
                  presence_penalty: 0.1,
                  seed: 642832912,
                  chat_template_kwargs: {
                    enable_thinking: false,
                  },
                  stream: true,
                }),
              });

              if (!llmResp.ok) {
                res.statusCode = 502;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    error: `LLM request failed (${llmResp.status}). Check OPENAI_BASE_URL and OPENAI_MODEL.`,
                  }),
                );
                return;
              }

              res.statusCode = 200;
              res.setHeader("Content-Type", "text/event-stream");
              res.setHeader("Cache-Control", "no-cache");
              res.setHeader("Connection", "keep-alive");

              if (!llmResp.body) {
                res.write(`data: ${JSON.stringify({ delta: "" })}\n\n`);
                res.write("data: [DONE]\n\n");
                res.end();
                return;
              }

              const reader = llmResp.body.getReader();
              const decoder = new TextDecoder();
              let upstreamBuffer = "";

              while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                upstreamBuffer += decoder.decode(value, { stream: true });
                const chunks = upstreamBuffer.split("\n\n");
                upstreamBuffer = chunks.pop() ?? "";

                for (const chunk of chunks) {
                  const lines = chunk.split("\n");
                  for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine.startsWith("data:")) continue;

                    const payload = trimmedLine.slice(5).trim();
                    if (!payload) continue;
                    if (payload === "[DONE]") {
                      res.write("data: [DONE]\n\n");
                      res.end();
                      return;
                    }

                    try {
                      const parsed = JSON.parse(payload) as {
                        choices?: Array<{
                          delta?: {
                            content?: string;
                            reasoning_content?: string;
                            reasoning?: string;
                          };
                        }>;
                      };
                      const thinkingDelta =
                        parsed.choices?.[0]?.delta?.reasoning_content ??
                        parsed.choices?.[0]?.delta?.reasoning ??
                        "";
                      if (thinkingDelta) {
                        res.write(`data: ${JSON.stringify({ thinkingDelta })}\n\n`);
                      }

                      const delta = parsed.choices?.[0]?.delta?.content ?? "";
                      if (delta) {
                        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
                      }
                    } catch {
                      res.write(`data: ${JSON.stringify({ delta: payload })}\n\n`);
                    }
                  }
                }
              }

              res.write("data: [DONE]\n\n");
              res.end();
            } catch (error) {
              res.statusCode = 502;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: `Cannot connect to LLM endpoint (${baseUrl}). Check OPENAI_BASE_URL / OPENAI_MODEL / network.`,
                  detail: error instanceof Error ? error.message : String(error),
                }),
              );
            }
          });
        },
      },
    ],
    server: {
      port: 5174,
    },
  };
});
