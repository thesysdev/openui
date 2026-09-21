import { createParser } from "@openuidev/lang-core";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { library } from "./library.mjs";
import { RequestError, streamCompletion, validateMessages } from "./transport.mjs";

export function createHandler({
  apiKey,
  model = "gpt-5.2",
  baseUrl = "https://api.openai.com/v1",
  fetchImpl = fetch,
  frontendPort = 4200,
} = {}) {
  const prompt = readFileSync(new URL("../generated/system-prompt.txt", import.meta.url), "utf8");
  const origins = new Set([`http://127.0.0.1:${frontendPort}`, `http://localhost:${frontendPort}`]);
  return async function handler(req, res) {
    const json = (status, body) => {
      res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify(body));
    };
    if (req.headers.origin && !origins.has(req.headers.origin))
      return json(403, {
        error: "This example only accepts requests from its local chat interface.",
      });
    if (req.method === "GET" && req.url === "/api/health")
      return json(200, {
        configured: Boolean(apiKey),
        model,
        runtime: "Angular 22",
      });
    if (req.method !== "POST" || req.url !== "/api/chat") return json(404, { error: "Not found" });
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new Error("Response timed out. Please retry.")),
      120000,
    );
    res.on("close", () => {
      if (!res.writableEnded) controller.abort();
    });
    const emit = (event) => {
      if (!res.destroyed) res.write(JSON.stringify(event) + "\n");
    };
    try {
      if (!req.headers["content-type"]?.startsWith("application/json"))
        throw new RequestError("Expected a JSON request.", 415);
      const chunks = [];
      let byteLength = 0;
      for await (const chunk of req) {
        byteLength += chunk.length;
        if (byteLength > 256000)
          throw new RequestError("Conversation is too large. Start a new chat.", 413);
        chunks.push(chunk);
      }
      let body;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        throw new RequestError("Invalid JSON request.");
      }
      const history = validateMessages(body);
      if (!apiKey)
        throw new RequestError(
          "Configure OPENAI_API_KEY in the server's local environment file, then restart the example.",
          503,
        );
      res.writeHead(200, {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      });
      res.flushHeaders();
      const messages = [{ role: "system", content: prompt }, ...history];
      const requestId = randomUUID().slice(0, 8);
      // Log counts only; never conversation content, credentials, or headers.
      console.info(`[chat ${requestId}] started; model=${model}; messages=${history.length}`);
      for (let attempt = 0; attempt < 2; attempt++) {
        console.info(`[chat ${requestId}] provider request ${attempt + 1}`);
        if (attempt) emit({ type: "reset", text: "Refining the generated interface…" });
        const content = await streamCompletion({
          apiKey,
          model,
          baseUrl,
          fetchImpl,
          messages,
          signal: controller.signal,
          onDelta: (text) => emit({ type: "delta", text }),
        });
        const parsed = createParser(library.toJSONSchema(), "Response").parse(content);
        const problems = parsed.meta.errors.map((error) => error.message);
        if (!parsed.root) problems.push("Missing root = Response([...]).");
        if (parsed.meta.unresolved.length)
          problems.push(`Unresolved references: ${parsed.meta.unresolved.join(", ")}`);
        if (!problems.length) {
          console.info(`[chat ${requestId}] completed; parser errors=0`);
          emit({ type: "done" });
          res.end();
          return;
        }
        if (attempt === 1)
          throw new Error(
            "The model produced an invalid interface after a correction attempt. Please retry or simplify the request.",
          );
        messages.push(
          { role: "assistant", content },
          {
            role: "user",
            content: `Correct this OpenUI Lang output. Return the complete corrected program only. Errors:\n${problems.slice(0, 8).join("\n")}`,
          },
        );
      }
    } catch (error) {
      if (res.destroyed) return;
      const message = controller.signal.aborted
        ? "The response was interrupted or timed out. You can retry."
        : error instanceof RequestError
          ? error.message
          : error instanceof Error && !/fetch failed|JSON|Unexpected/.test(error.message)
            ? error.message
            : "Could not complete the model request. Check the connection and try again.";
      if (res.headersSent) {
        emit({ type: "error", message });
        res.end();
      } else json(error instanceof RequestError ? error.status : 500, { error: message });
    } finally {
      clearTimeout(timeout);
    }
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Only the backend reads credentials. The local file may point at an
  // authorized existing environment file without duplicating its secret.
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const envFile = process.env["OPENUI_ENV_FILE"];
  if (envFile && existsSync(envFile)) process.loadEnvFile(envFile);
  const server = createServer(
    createHandler({
      apiKey: process.env["OPENAI_API_KEY"],
      frontendPort: Number(process.env["PORT"] || 4200),
      model: process.env["OPENAI_MODEL"] || "gpt-5.2",
      baseUrl: process.env["OPENAI_BASE_URL"] || "https://api.openai.com/v1",
    }),
  );
  const port = Number(process.env["API_PORT"] || 4300);
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `Chat API: http://127.0.0.1:${port} (${process.env["OPENAI_API_KEY"] ? "model key configured" : "model key missing"})`,
    ),
  );
}
