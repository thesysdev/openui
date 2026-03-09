"use client";

import { openuiExamples, openuiLibrary } from "@openuidev/react-ui";
import { Send, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CatalogPanel } from "./components/CatalogPanel/CatalogPanel";
import { CodePanel } from "./components/CodePanel/CodePanel";
import { Header } from "./components/Header/Header";
import { PreviewPanel } from "./components/PreviewPanel/PreviewPanel";
import { MODELS, STARTER_PROMPTS, type Model, type Status, type Theme } from "./constants";

const SYSTEM_PROMPT = openuiLibrary.prompt({ examples: openuiExamples });

export default function PlaygroundPage() {
  const [theme, setTheme] = useState<Theme>("system");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<Model>("anthropic/claude-sonnet-4.6");
  const [code, setCode] = useState("");
  const [parsedJson, setParsedJson] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const el = document.documentElement;
    if (theme === "system") {
      el.removeAttribute("data-theme");
    } else {
      el.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const cycleTheme = () => {
    setTheme((t) => (t === "system" ? "light" : t === "light" ? "dark" : "system"));
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleChipClick = (text: string) => {
    setPrompt(text);
    textareaRef.current?.focus();
  };

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || status === "streaming") return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setCode("");
    setParsedJson(null);
    setErrorMsg("");
    setStatus("streaming");

    try {
      const res = await fetch("/api/playground/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt: prompt.trim(), systemPrompt: SYSTEM_PROMPT }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: { message?: string } }).error?.message ?? `Server error ${res.status}`,
        );
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        for (const line of raw.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") {
            setStatus("done");
            return;
          }
          try {
            const parsed = JSON.parse(data) as {
              choices: Array<{ delta: { content?: string } }>;
            };
            const content = parsed.choices[0]?.delta?.content;
            if (content) setCode((prev) => prev + content);
          } catch {
            // skip malformed chunks
          }
        }
      }
      setStatus("done");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }, [model, prompt, status]);

  const handleStop = () => {
    abortRef.current?.abort();
    setStatus("idle");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = status === "streaming";

  return (
    <div className="app">
      <Header theme={theme} onThemeToggle={cycleTheme} hasApiKey={false} onChangeKey={() => {}} />

      <div className="app-body">
        <CatalogPanel />
        <div className="content-wrapper">
          <div className="prompt-section">
            <h1 className="prompt-heading">What do you want to build?</h1>

            <div className="prompt-container">
              <textarea
                ref={textareaRef}
                className="prompt-textarea"
                placeholder="Describe the UI you want to generate…"
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                disabled={isDisabled}
                rows={2}
              />
              <div className="prompt-actions">
                <select
                  className="model-select"
                  value={model}
                  onChange={(e) => setModel(e.target.value as Model)}
                  disabled={isDisabled}
                >
                  {MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                {status === "streaming" ? (
                  <button className="stop-btn" onClick={handleStop}>
                    <Square size={12} fill="currentColor" />
                    Stop
                  </button>
                ) : (
                  <button className="send-btn" onClick={handleSubmit} disabled={!prompt.trim()}>
                    <Send size={14} />
                    Generate
                  </button>
                )}
              </div>
            </div>

            <div className="chips-row">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  className="chip"
                  onClick={() => handleChipClick(p)}
                  disabled={isDisabled}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {status === "error" && errorMsg && <div className="error-banner">{errorMsg}</div>}

          <div className="split-screen">
            <CodePanel code={code} status={status} parsedJson={parsedJson} />
            <PreviewPanel
              code={code}
              isStreaming={status === "streaming"}
              onParseResult={(r) => setParsedJson(r ? JSON.stringify(r, null, 2) : null)}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
