import { Field } from "@ark-ui/solid/field";
import { BuiltinActionType, Renderer, type ActionEvent } from "@openuidev/solid-lang";
import { createSignal, For, Show } from "solid-js";
import { library } from "./lib/library";

type ChatMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; response: string; streaming: boolean; started: boolean };

export default function App() {
  const [messages, setMessages] = createSignal<ChatMessage[]>([]);
  const [input, setInput] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading()) return;

    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "assistant", response: "", streaming: true, started: false },
    ]);

    const openUiStartRegex = /[A-Za-z_][A-Za-z0-9_]*\s*=\s*[A-Za-z_][A-Za-z0-9_]*\s*\(/;

    const sanitizeModelText = (input: string) =>
      input
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/```openui-lang/gi, "")
        .replace(/```/g, "");

    const appendAssistantDelta = (delta: string) => {
      if (!delta) return;
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          const msg = next[i];
          if (msg?.role === "assistant" && msg.streaming) {
            const response = msg.response + delta;
            next[i] = {
              ...msg,
              response,
              started: openUiStartRegex.test(sanitizeModelText(response)),
            };
            break;
          }
        }
        return next;
      });
    };

    const finishAssistantStream = (fallbackError?: string) => {
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          const msg = next[i];
          if (msg?.role === "assistant" && msg.streaming) {
            const raw = sanitizeModelText(msg.response || "");
            const assignIndex = raw.search(
              /[A-Za-z_][A-Za-z0-9_]*\s*=\s*[A-Za-z_][A-Za-z0-9_]*\s*\(/,
            );
            const cleaned = assignIndex >= 0 ? raw.slice(assignIndex).trim() : "";

            const response =
              cleaned ||
              `t1 = TextContent("Error: ${(fallbackError || "Empty response").replaceAll('"', '\\"')}")\ncard = Card("LLM Stream Error", [t1])\nroot = Stack([card])`;
            next[i] = { ...msg, response, streaming: false };
            break;
          }
        }
        return next;
      });
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok || !response.body) {
        finishAssistantStream(`HTTP ${response.status} from chat API`);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith("data:")) continue;
            const payload = trimmedLine.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload) as { delta?: string };
              if (parsed.delta) appendAssistantDelta(parsed.delta);
            } catch {
              appendAssistantDelta(payload);
            }
          }
        }
      }

      finishAssistantStream();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error";
      finishAssistantStream(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAction(event: ActionEvent) {
    if (event.type === BuiltinActionType.ContinueConversation && event.humanFriendlyMessage) {
      void sendMessage(event.humanFriendlyMessage);
    }
  }

  return (
    <div
      style={{
        margin: "0 auto",
        padding: "28px 20px",
        "max-width": "1100px",
        "font-family": "Avenir Next, Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          margin: "0 0 20px",
          padding: "16px",
          border: "1px solid rgba(148,163,184,0.28)",
          "border-radius": "16px",
          background: "linear-gradient(120deg, #f8fafc 0%, #eef2ff 55%, #f0f9ff 100%)",
          "box-shadow": "0 10px 26px rgba(15, 23, 42, 0.08)",
        }}
      >
        <h1 style={{ margin: "0 0 6px", "font-size": "22px", color: "#0f172a" }}>
          OpenUI Solid Dashboard Chat
        </h1>
        <p style={{ margin: 0, color: "#475569" }}>
          Modern generative dashboard example using Ark UI and ECharts.
        </p>
      </div>

      <div style={{ display: "grid", gap: "14px", margin: "0 0 18px" }}>
        <For each={messages()}>
          {(message) => (
            <div>
              <Show when={message.role === "user"}>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
                    color: "#f8fafc",
                    "border-radius": "12px",
                    width: "fit-content",
                    "max-width": "75%",
                    "margin-left": "auto",
                  }}
                >
                  {(message as { role: "user"; text: string }).text}
                </div>
              </Show>

              <Show when={message.role === "assistant"}>
                <div
                  style={{
                    padding: "14px",
                    background: "rgba(248,250,252,0.92)",
                    border: "1px solid rgba(148,163,184,0.28)",
                    "border-radius": "14px",
                  }}
                >
                  <Show
                    when={
                      (message as { role: "assistant"; started: boolean; streaming: boolean })
                        .started ||
                      !(message as { role: "assistant"; streaming: boolean }).streaming
                    }
                    fallback={
                      <div
                        style={{
                          display: "inline-flex",
                          gap: "8px",
                          "align-items": "center",
                          color: "#475569",
                          "font-size": "13px",
                        }}
                      >
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            "border-radius": "999px",
                            background: "#2563eb",
                            animation: "pulse 1.1s ease-in-out infinite",
                          }}
                        />
                        Generating UI...
                      </div>
                    }
                  >
                    <Renderer
                      response={(message as { role: "assistant"; response: string }).response}
                      library={library}
                      isStreaming={(message as { role: "assistant"; streaming: boolean }).streaming}
                      onAction={handleAction}
                    />
                  </Show>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage(input());
        }}
        style={{
          display: "flex",
          gap: "10px",
          padding: "10px",
          border: "1px solid rgba(148,163,184,0.28)",
          "border-radius": "14px",
          background: "#f8fafc",
        }}
      >
        <Field.Root style={{ flex: 1 }}>
          <Field.Input
            value={input()}
            onInput={(event: InputEvent & { currentTarget: HTMLInputElement }) =>
              setInput(event.currentTarget.value)
            }
            placeholder="Ask anything..."
            style={{
              width: "100%",
              padding: "11px 12px",
              border: "1px solid #cbd5e1",
              "border-radius": "12px",
              background: "#ffffff",
            }}
          />
        </Field.Root>
        <button
          type="submit"
          disabled={isLoading()}
          style={{
            padding: "10px 14px",
            border: "1px solid #0f172a",
            background: "#0f172a",
            color: "#ffffff",
            "border-radius": "10px",
            cursor: "pointer",
            opacity: isLoading() ? 0.6 : 1,
          }}
        >
          {isLoading() ? "Loading..." : "Send"}
        </button>
      </form>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.35; transform: scale(0.9);} 50% { opacity: 1; transform: scale(1);} }`}</style>
    </div>
  );
}
