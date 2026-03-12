"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ParseResult } from "@openuidev/structured-output";
import { invoiceMeta, invoiceSchemaMap, type InvoiceFormat } from "./schemas";

type GenerationState = "idle" | "streaming" | "done" | "error";

const FORMAT_ICONS: Record<InvoiceFormat, string> = {
  standard: "receipt",
  freelance: "schedule",
  international: "public",
};

export default function Page() {
  const [format, setFormat] = useState<InvoiceFormat>("standard");
  const [userPrompt, setUserPrompt] = useState(invoiceMeta.standard.samplePrompt);
  const [state, setState] = useState<GenerationState>("idle");
  const [rawOutput, setRawOutput] = useState("");
  const [thinking, setThinking] = useState("");
  const [parsedResult, setParsedResult] = useState<ParseResult<unknown> | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [jsonTab, setJsonTab] = useState<"result" | "schema" | "systemPrompt">("result");

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll output when streaming
  useEffect(() => {
    if (state === "streaming" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [rawOutput, thinking, parsedResult, state]);

  const handleGenerate = useCallback(async () => {
    const entry = invoiceMeta[format];
    const prompt = userPrompt.trim() || entry.samplePrompt;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState("streaming");
    setRawOutput("");
    setThinking("");
    setParsedResult(null);
    setErrorMessage("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, userPrompt: prompt }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      const parser = invoiceSchemaMap.streamingParser();
      let accContent = "";
      let accThinking = "";
      let lineBuf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuf += decoder.decode(value, { stream: true });
        const lines = lineBuf.split("\n");
        lineBuf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line) as { type: string; content: string };
            if (evt.type === "thinking") {
              accThinking += evt.content;
              setThinking(accThinking);
            } else if (evt.type === "content") {
              accContent += evt.content;
              setRawOutput(accContent);
              const result = parser.push(evt.content);
              setParsedResult({ ...result });
            } else if (evt.type === "error") {
              throw new Error(evt.content);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      const finalResult = parser.getResult();
      setParsedResult({ ...finalResult });
      setState("done");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorMessage((err as Error).message);
      setState("error");
    }
  }, [format, userPrompt]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setState("done");
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col">

      {/* Header */}
      <header className="border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <span className="material-symbols-rounded text-indigo-400 text-xl block">
                description
              </span>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-zinc-100">
                Invoice Extractor
              </h1>
              <p className="text-xs text-zinc-500 hidden sm:block max-w-90">
                Natural language to structured output. Select an invoice type and click on &quot;Extract Invoice&quot; to see the structured JSON result.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/openuidev/structured-output"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input & Selection */}
        <section className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                Invoice in natural language
              </h2>
              <button
                onClick={() => setUserPrompt("")}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Clear input"
              >
                Clear
              </button>
            </div>

            {/* Unified Input Card */}
            <div className="bg-zinc-900/60 rounded-xl border border-white/10 overflow-hidden flex flex-col transition-colors focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20">
              <textarea
                value={userPrompt}
                readOnly
                placeholder="Select an invoice template below..."
                className="w-full h-48 lg:h-56 bg-transparent px-4 py-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none transition-all leading-relaxed cursor-default"
              />

              <div className="border-t border-white/5 bg-zinc-900/40 p-1 flex gap-1">
                {(Object.keys(invoiceMeta) as InvoiceFormat[]).map((key) => {
                  const meta = invoiceMeta[key];
                  const selected = format === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setFormat(key);
                        setUserPrompt(meta.samplePrompt);
                      }}
                      title={meta.description}
                      className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all duration-200 ${selected
                        ? "bg-zinc-800 text-indigo-400 shadow-sm ring-1 ring-white/10"
                        : "hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                      <span className="text-[10px] font-medium uppercase tracking-wide">
                        {meta.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {state === "streaming" ? (
                <button
                  onClick={handleStop}
                  className="flex-1 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-all active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-rounded text-lg">stop_circle</span>
                    Stop Generation
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={!userPrompt}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-rounded text-lg">auto_awesome</span>
                    Extract Invoice
                  </span>
                </button>
              )}
            </div>

          </div>
        </section>

        {/* Right Column: Output */}
        <section className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-start gap-3">
              <span className="material-symbols-rounded text-red-400 mt-0.5">error</span>
              <div>
                <strong className="block font-medium text-red-400 mb-0.5">Extraction Failed</strong>
                {errorMessage}
              </div>
            </div>
          )}

          <div className="flex-1 grid grid-rows-2 gap-4 h-[calc(100vh-8rem)]">
            {/* Top: JSON Result */}
            <div className="flex flex-col bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 bg-zinc-900/50 p-2 pl-4">
                <div className="flex items-center gap-1 rounded-md bg-zinc-800/60 p-1">
                  <button
                    onClick={() => setJsonTab("result")}
                    className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${jsonTab === "result" ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                  >
                    JSON Result
                  </button>
                  <button
                    onClick={() => setJsonTab("schema")}
                    className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${jsonTab === "schema" ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                  >
                    JSON Schema
                  </button>
                  <button
                    onClick={() => setJsonTab("systemPrompt")}
                    className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${jsonTab === "systemPrompt" ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                  >
                    System Prompt
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-xs px-2">
                    {state === "streaming" && (
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Processing
                      </span>
                    )}
                    {state === "done" && (
                      <span className="flex items-center gap-1.5 text-zinc-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {parsedResult?.meta.statementCount ?? 0} statements
                      </span>
                    )}
                  </div>
                  <div className="h-4 w-px bg-white/10" />
                  <button
                    onClick={() =>
                      copyToClipboard(
                        jsonTab === "result"
                          ? JSON.stringify(parsedResult?.root, null, 2) || ""
                          : jsonTab === "schema"
                            ? JSON.stringify(invoiceSchemaMap.schemas[format].toJSONSchema(), null, 2)
                            : invoiceSchemaMap.schemas[format].prompt(),
                      )
                    }
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded transition-colors"
                    title={
                      jsonTab === "result"
                        ? "Copy JSON Result"
                        : jsonTab === "schema"
                          ? "Copy JSON Schema"
                          : "Copy System Prompt"
                    }
                  >
                    <span className="material-symbols-rounded text-lg">content_copy</span>
                  </button>
                </div>
              </div>

              <div className="relative flex-1 bg-zinc-950/50 overflow-hidden">
                <div className="absolute inset-0 overflow-auto p-4 font-mono text-xs leading-relaxed">
                  {jsonTab === "result" ? (
                    <>
                      {parsedResult?.root ? (
                        <pre className="text-emerald-300/90 whitespace-pre-wrap break-words">
                          {JSON.stringify(parsedResult.root, null, 2)}
                        </pre>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                          {state === "streaming" ? (
                            <span className="animate-pulse">Parsing JSON...</span>
                          ) : (
                            <span>No valid JSON extracted yet.</span>
                          )}
                        </div>
                      )}

                      {state === "done" && parsedResult?.meta.validationErrors.length ? (
                        <div className="mt-8 pt-8 border-t border-dashed border-amber-900/30">
                          <h4 className="text-amber-500 font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-rounded text-lg">warning</span>
                            Validation Issues ({parsedResult.meta.validationErrors.length})
                          </h4>
                          <ul className="space-y-2">
                            {parsedResult.meta.validationErrors.map((e, i) => (
                              <li key={i} className="bg-amber-950/20 border border-amber-900/30 rounded p-3 text-amber-200/70">
                                <code className="text-amber-400 block mb-1">{e.path || "root"}</code>
                                {e.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </>
                  ) : jsonTab === "schema" ? (
                    <pre className="text-zinc-300 whitespace-pre-wrap break-all">
                      {`// Note: This JSON schema is for display only and is not sent to the LLM.\n${JSON.stringify(
                        invoiceSchemaMap.schemas[format].toJSONSchema(),
                        null,
                        2,
                      )}`}
                    </pre>
                  ) : (
                    <pre className="text-zinc-300 whitespace-pre-wrap break-words">
                      {invoiceSchemaMap.schemas[format].prompt()}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom: Raw Output */}
            <div className="flex flex-col bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 bg-zinc-900/50 p-2 pl-4">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Raw Output</span>
                <button
                  onClick={() => copyToClipboard(rawOutput || "")}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded transition-colors"
                  title="Copy Raw Output"
                >
                  <span className="material-symbols-rounded text-lg">content_copy</span>
                </button>
              </div>
              <div className="relative flex-1 bg-zinc-950/50 overflow-hidden" ref={scrollRef}>
                <div className="absolute inset-0 overflow-auto p-4 font-mono text-xs leading-relaxed">
                  <pre className="text-zinc-300 whitespace-pre-wrap break-all">
                    {rawOutput || <span className="text-zinc-700 italic">Waiting for output...</span>}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
