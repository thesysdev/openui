export class RequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function validateMessages(body) {
  if (
    !body ||
    !Array.isArray(body.messages) ||
    !body.messages.length ||
    body.messages.length > 40
  ) {
    throw new RequestError("Send between 1 and 40 conversation messages.");
  }
  const messages = body.messages.map((message) => {
    if (
      !message ||
      !["user", "assistant"].includes(message.role) ||
      typeof message.content !== "string" ||
      !message.content.trim() ||
      message.content.length > 40000
    ) {
      throw new RequestError(
        "Messages must contain user or assistant text (up to 40,000 characters).",
      );
    }
    return { role: message.role, content: message.content };
  });
  if (messages.at(-1).role !== "user")
    throw new RequestError("The last message must be from the user.");
  return messages;
}

// Handle arbitrary TCP chunk boundaries, CRLF, comments, and multi-line SSE data.
export async function* parseSSE(body) {
  const decoder = new TextDecoder();
  let buffer = "";
  let data = [];
  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true });
    if (buffer.length > 1_000_000) throw new Error("Provider stream frame was too large.");
    let newline;
    while ((newline = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newline).replace(/\r$/, "");
      buffer = buffer.slice(newline + 1);
      if (line === "") {
        if (data.length) yield data.join("\n");
        data = [];
      } else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
    }
  }
  buffer += decoder.decode();
  if (buffer.startsWith("data:")) data.push(buffer.slice(5).trim());
  if (data.length) yield data.join("\n");
}

export async function streamCompletion({
  fetchImpl = fetch,
  apiKey,
  model,
  baseUrl,
  messages,
  signal,
  onDelta,
}) {
  const upstream = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    signal,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true, max_completion_tokens: 6000 }),
  });
  if (!upstream.ok) {
    const providerError = await upstream.json().catch(() => null);
    const quotaExhausted =
      providerError?.error?.type === "insufficient_quota" ||
      ["insufficient_quota", "credit_balance_exhausted"].includes(providerError?.error?.code);
    // These allowlisted classifications help diagnose rate limits without
    // logging the provider's message (which can include account identifiers).
    if (upstream.status === 429) {
      const safeLabel = (value) =>
        typeof value === "string" && /^[a-z_]{1,50}$/.test(value) ? value : "unknown";
      const retryAfter = upstream.headers.get("retry-after");
      console.warn(
        `[provider] HTTP 429; code=${safeLabel(providerError?.error?.code)}; type=${safeLabel(providerError?.error?.type)}; retry-after=${retryAfter && /^\d+(\.\d+)?$/.test(retryAfter) ? retryAfter : "unspecified"}`,
      );
    }
    const message =
      upstream.status === 401
        ? "The model provider rejected the server's API key. Check the local environment configuration."
        : upstream.status === 429
          ? quotaExhausted
            ? "The OpenAI account has insufficient quota or has reached its spending limit. Add API credits or configure another authorized key before retrying."
            : "The model provider returned a rate-limit error. Please wait and retry, or check the account's API limits."
          : `The model provider returned HTTP ${upstream.status}. Check the configured model and try again.`;
    throw new RequestError(message, 502);
  }
  if (!upstream.body) throw new Error("The model provider returned an empty stream.");
  let result = "";
  let ended = false;
  let finishReason = null;
  for await (const frame of parseSSE(upstream.body)) {
    if (frame === "[DONE]") {
      ended = true;
      break;
    }
    const event = JSON.parse(frame);
    if (event.error) throw new Error("The model provider reported a streaming error.");
    const choice = event.choices?.[0];
    if (choice?.finish_reason) finishReason = choice.finish_reason;
    if (choice?.delta?.refusal)
      throw new Error("The model declined this request. Please try a different prompt.");
    const delta = choice?.delta?.content;
    if (typeof delta === "string") {
      result += delta;
      if (result.length > 150000)
        throw new Error("The model response exceeded the local example's size limit.");
      onDelta(delta);
    }
  }
  if (!ended)
    throw new Error("The model connection closed before the reply finished. Please retry.");
  if (finishReason === "length")
    throw new Error("The model reached its output limit. Try a smaller request.");
  if (!result.trim()) throw new Error("The model returned no displayable content. Please retry.");
  return result;
}
