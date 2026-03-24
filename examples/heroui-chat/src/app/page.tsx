"use client";

import { herouiChatLibrary } from "@/lib/heroui-genui";
import type { Message } from "@openuidev/react-headless";
import {
  openAIAdapter,
  openAIMessageFormat,
  processStreamedMessage,
} from "@openuidev/react-headless";
import { Renderer } from "@openuidev/react-lang";
import { ArrowLeft, CornerDownLeft, Square } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const STARTERS = [
  {
    label: "Contact form",
    prompt: "Build me a contact form with name, email, topic, and message fields.",
  },
  {
    label: "Registration",
    prompt:
      "Create a user registration form with first name, last name, email, password, and country fields.",
  },
  {
    label: "Job application",
    prompt:
      "Build a job application form with personal info, position, experience, and a cover letter field.",
  },
  {
    label: "Feedback survey",
    prompt:
      "Create a feedback survey form with a rating slider, category dropdown, and comments textarea.",
  },
];


export default function Page() {
  const [instruction, setInstruction] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingCode, setStreamingCode] = useState<string | null>(null);
  const [latestCode, setLatestCode] = useState<string | null>(null);
  const [formFieldSnapshot, setFormFieldSnapshot] = useState<Record<string, unknown>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? instruction).trim();
    if (!text || isStreaming) return;

    setError(null);
    setInstruction("");

    let userContent = text;
    if (Object.keys(formFieldSnapshot).length > 0) {
      userContent = `Current form values (JSON): ${JSON.stringify(formFieldSnapshot)}\n\n${text}`;
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: userContent };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    const abortController = new AbortController();
    abortRef.current = abortController;
    setIsStreaming(true);
    setStreamingCode("");

    let draftContent = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: openAIMessageFormat.toApi(nextMessages as any),
        }),
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const assistantId = crypto.randomUUID();

      await processStreamedMessage({
        response,
        adapter: openAIAdapter(),
        createMessage: (msg) => {
          draftContent = msg.content ?? "";
          setStreamingCode(draftContent);
        },
        updateMessage: (msg) => {
          draftContent = msg.content ?? "";
          setStreamingCode(draftContent);
        },
        deleteMessage: () => {
          draftContent = "";
          setStreamingCode("");
        },
      });

      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: draftContent,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLatestCode(draftContent);
      setStreamingCode(null);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message ?? "Something went wrong.");
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [instruction, isStreaming, messages, formFieldSnapshot]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setLatestCode(null);
    setStreamingCode(null);
    setFormFieldSnapshot({});
    setError(null);
    setInstruction("");
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const rendererResponse = streamingCode ?? latestCode;
  const hasForm = rendererResponse !== null;

  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => {
      const content = (m.content as string) ?? "";
      return content.replace(/^Current form values \(JSON\): .+\n\n/, "");
    });

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!hasForm && !isStreaming) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-lg flex flex-col gap-8">
          {/* Title */}
          <div className="text-center flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              AI Form Generator
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base">
              Describe a form and get a live, interactive preview instantly.
            </p>
          </div>

          {/* Input */}
          <div className="flex flex-col gap-2">
            <div className="relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors shadow-sm">
              <textarea
                aria-label="Form instruction"
                placeholder="Describe the form you want to generate…"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={4}
                className="w-full resize-none bg-transparent px-4 pt-3 pb-11 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none rounded-2xl"
              />
              <button
                onClick={() => handleSubmit()}
                disabled={!instruction.trim() || isStreaming}
                className="absolute bottom-2.5 right-2.5 flex items-center justify-center w-7 h-7 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                aria-label="Send"
              >
                <CornerDownLeft size={14} strokeWidth={2.5} />
              </button>
            </div>
            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
          </div>

          {/* Stacked examples */}
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Try out examples</p>
            {STARTERS.map((s) => (
              <button
                key={s.label}
                onClick={() => { setInstruction(s.prompt); handleSubmit(s.prompt); }}
                className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3 flex flex-col gap-0.5 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-900 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {s.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                  {s.prompt}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Form generation page ─────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen overflow-hidden flex bg-gray-50 dark:bg-gray-950">
      {/* Left pane */}
      <aside className="w-80 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {/* Form title */}
        <div className="shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <button
            onClick={handleReset}
            className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={15} strokeWidth={2} />
          </button>
          <h2 className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-50 truncate">
            {userMessages[0] ?? "Form"}
          </h2>
        </div>

        {/* Message history */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {userMessages.slice(1).length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-600 text-center mt-4">
              Refinements will appear here.
            </p>
          )}
          {userMessages.slice(1).map((msg, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2.5"
            >
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{msg}</p>
            </div>
          ))}
        </div>

        {/* Bottom input */}
        <div className="shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2">
          <div className="relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors shadow-sm">
            <textarea
              aria-label="Refinement instruction"
              placeholder="Describe a change to refine the form…"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              disabled={isStreaming}
              className="w-full resize-none bg-transparent px-4 pt-3 pb-11 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none rounded-2xl disabled:opacity-50"
            />
            <button
              onClick={isStreaming ? () => abortRef.current?.abort() : () => handleSubmit()}
              disabled={!isStreaming && !instruction.trim()}
              className="absolute bottom-2.5 right-2.5 flex items-center justify-center w-7 h-7 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
              aria-label={isStreaming ? "Stop" : "Send"}
            >
              {isStreaming ? (
                <Square size={12} fill="currentColor" />
              ) : (
                <CornerDownLeft size={14} strokeWidth={2.5} />
              )}
            </button>
          </div>
          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        </div>
      </aside>

      {/* Right pane — rendered form */}
      <main className="form-canvas flex-1 overflow-y-auto p-8 flex items-start justify-center">
        <div className="w-full max-w-240 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
          <Renderer
            response={rendererResponse}
            library={herouiChatLibrary}
            isStreaming={isStreaming}
            onStateUpdate={(state) => setFormFieldSnapshot(state)}
            initialState={formFieldSnapshot}
          />
        </div>
      </main>
    </div>
  );
}
