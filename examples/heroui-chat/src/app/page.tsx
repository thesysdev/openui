"use client";

import { herouiChatLibrary } from "@/lib/heroui-genui";
import { Button, Card, Chip, Spinner, TextArea } from "@heroui/react";
import type { Message } from "@openuidev/react-headless";
import {
  openAIAdapter,
  openAIMessageFormat,
  processStreamedMessage,
} from "@openuidev/react-headless";
import { Renderer } from "@openuidev/react-lang";
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

  const handleSubmit = useCallback(async () => {
    const text = instruction.trim();
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
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const rendererResponse = streamingCode ?? latestCode;
  const hasForm = rendererResponse !== null;

  const pastInstructions = messages
    .filter((m) => m.role === "user")
    .map((m) => {
      const content = (m.content as string) ?? "";
      const jsonPrefix = /^Current form values \(JSON\): .+\n\n/;
      return content.replace(jsonPrefix, "");
    });

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Form Generator</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Describe a form and get a live preview
          </p>
        </div>
        {hasForm && (
          <Button variant="tertiary" size="sm" onPress={handleReset}>
            Reset
          </Button>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <aside className="w-90 shrink-0 flex flex-col gap-4 p-4 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <TextArea
              aria-label="Form instruction"
              placeholder={
                hasForm
                  ? "Describe a change to refine the form…"
                  : "Describe the form you want to generate…"
              }
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={5}
              disabled={isStreaming}
            />
            <div className="flex gap-2">
              <Button
                variant="primary"
                onPress={handleSubmit}
                isDisabled={!instruction.trim() || isStreaming}
                className="flex-1"
              >
                {isStreaming ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Generating…
                  </span>
                ) : hasForm ? (
                  "Refine Form"
                ) : (
                  "Generate Form"
                )}
              </Button>
              {isStreaming && (
                <Button variant="tertiary" onPress={() => abortRef.current?.abort()}>
                  Stop
                </Button>
              )}
            </div>
            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {hasForm ? "⌘ Enter to refine" : "⌘ Enter to generate"}
            </p>
          </div>

          {/* Example starters */}
          {!hasForm && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Examples
              </p>
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((s) => (
                  <Chip
                    key={s.label}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setInstruction(s.prompt)}
                  >
                    {s.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Past instructions */}
          {pastInstructions.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                History
              </p>
              <ol className="flex flex-col gap-1">
                {pastInstructions.map((inst, i) => (
                  <li key={i} className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    <span className="font-medium text-gray-400 dark:text-gray-500 mr-1">
                      {i + 1}.
                    </span>
                    {inst}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>

        {/* Right panel */}
        <main className="flex-1 overflow-y-auto p-6 flex items-start justify-center">
          {!hasForm && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-gray-400 dark:text-gray-600 max-w-xs">
              <p className="text-4xl">⊡</p>
              <p className="text-sm">Your generated form will appear here.</p>
            </div>
          ) : (
            <Card.Root className="w-full max-w-[960px] shadow-sm">
              <Card.Content className="p-6">
                <Renderer
                  response={rendererResponse}
                  library={herouiChatLibrary}
                  isStreaming={isStreaming}
                  onStateUpdate={(state) => setFormFieldSnapshot(state)}
                  initialState={formFieldSnapshot}
                />
              </Card.Content>
            </Card.Root>
          )}
        </main>
      </div>
    </div>
  );
}
