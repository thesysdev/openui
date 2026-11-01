"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { parseArtifactReference } from "@openuidev/react-headless";
import {
  ArrowUp,
  GitPullRequestArrow,
  LayoutDashboard,
  Package,
  ShieldAlert,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { ChatCompletionMessageParam, ChatEvent } from "../lib/chat-events";
import { Markdown } from "./markdown";

/** A dashboard tool's result in the chat: the response, and the card's key for opening it. */
export interface DashboardResult {
  key: string;
  id: string;
  response: string;
  edited: boolean;
}

/** A reply, in order: text the model wrote, and the dashboards its tools returned in between. */
type Part = { type: "text"; text: string } | { type: "dashboard"; result: DashboardResult };

type Item = { role: "user"; text: string } | { role: "assistant"; parts: Part[]; error?: string };

const starters = [
  {
    icon: Package,
    title: "Framework downloads",
    detail: "react vs vue vs svelte on npm",
    prompt:
      "Compare weekly npm downloads for react, vue and svelte over the last 6 months, with a range filter, a KPI per package and a table of totals.",
  },
  {
    icon: GitPullRequestArrow,
    title: "Next.js health",
    detail: "Stars, issues, releases, downloads",
    prompt:
      "A health dashboard for vercel/next.js: stars, forks and open issues, commits per week, release cadence, latest releases, and weekly npm downloads of next.",
  },
  {
    icon: ShieldAlert,
    title: "lodash security",
    detail: "Advisories by severity and fixes",
    prompt:
      "Security overview for lodash: known vulnerabilities by severity, the most severe ones, and which versions fix them.",
  },
];

interface ChatProps {
  /** The dashboard the user has open, so "this" can refer to it. */
  openDashboard?: { id: string; title?: string };
  /** Stop talking about the open dashboard: closes it. */
  onCloseDashboard: () => void;
  /** Text to put in the composer, such as an edit request from a dashboard's Edit button. */
  draft: { text: string } | null;
  /** A dashboard tool returned: open its card. */
  onDashboard: (result: DashboardResult) => void;
  renderDashboard: (result: DashboardResult) => ReactNode;
}

/** A small chat: a message list, a composer, and the assistant's reply streamed from /api/chat. */
export function Chat({
  openDashboard,
  onCloseDashboard,
  draft,
  onDashboard,
  renderDashboard,
}: ChatProps) {
  const [items, setItems] = useState<Item[]>([]);
  // The conversation in Chat Completions format, tool calls and results included, so the model
  // has every dashboard's id for later edits.
  const history = useRef<ChatCompletionMessageParam[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!draft) return;
    setInput(draft.text);
    inputRef.current?.focus();
  }, [draft]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [items]);

  // Applies a change to the reply being streamed, the last item.
  const updateReply = (
    change: (
      reply: Extract<Item, { role: "assistant" }>,
    ) => Partial<Extract<Item, { role: "assistant" }>>,
  ) =>
    setItems((current) => {
      const reply = current.at(-1);
      if (reply?.role !== "assistant") return current;
      return [...current.slice(0, -1), { ...reply, ...change(reply) }];
    });

  async function send(text: string) {
    if (!text.trim() || running) return;
    const turn = items.length;
    let dashboards = 0;
    // A tool result ends the model's turn: text after it starts a new part, so two turns' text
    // doesn't run together.
    let newPart = true;
    const content = openDashboard
      ? `${text}\n\n(The user has the dashboard "${openDashboard.title ?? openDashboard.id}" open, artifact_id ${openDashboard.id}.)`
      : text;
    const question: ChatCompletionMessageParam = { role: "user", content };
    setItems((current) => [...current, { role: "user", text }, { role: "assistant", parts: [] }]);
    setInput("");
    const controller = new AbortController();
    setRunning(controller);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...history.current, question] }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `The chat request failed: ${response.status}`);
      }
      // One JSON event per line.
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines.filter(Boolean)) {
          const event = JSON.parse(line) as ChatEvent;
          if (event.type === "text") {
            const startPart = newPart;
            newPart = false;
            updateReply(({ parts }) => {
              const last = parts.at(-1);
              return startPart || last?.type !== "text"
                ? { parts: [...parts, { type: "text", text: event.delta }] }
                : {
                    parts: [...parts.slice(0, -1), { type: "text", text: last.text + event.delta }],
                  };
            });
          } else if (event.type === "dashboard") {
            newPart = true;
            // The response names the dashboard; a tool error doesn't, and the model explains it.
            const reference = parseArtifactReference(event.response);
            if (!reference) continue;
            const result: DashboardResult = {
              key: `${turn}:${dashboards++}`,
              id: reference.id,
              response: event.response,
              edited: event.tool === "edit_dashboard",
            };
            updateReply(({ parts }) => ({ parts: [...parts, { type: "dashboard", result }] }));
            onDashboard(result);
          } else if (event.type === "done") {
            history.current = [...history.current, question, ...event.messages];
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (error) {
      if (!controller.signal.aborted)
        updateReply(() => ({ error: error instanceof Error ? error.message : String(error) }));
    } finally {
      setRunning(null);
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-4 pt-10 pb-6 sm:px-6">
          {items.length === 0 && <Welcome onPick={(prompt) => void send(prompt)} />}
          {items.map((item, index) =>
            item.role === "user" ? (
              <div key={index} className="flex justify-end">
                <p className="max-w-[80%] rounded-2xl bg-muted px-4 py-2.5 text-[15px] leading-6 break-words whitespace-pre-wrap text-foreground">
                  {item.text}
                </p>
              </div>
            ) : (
              <AssistantMessage
                key={index}
                item={item}
                thinking={index === items.length - 1 && running !== null}
                renderDashboard={renderDashboard}
              />
            ),
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        <form onSubmit={submit} className="mx-auto w-full max-w-[720px]">
          {openDashboard && (
            <div className="mb-2 flex">
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-background py-1 pr-1 pl-2.5 text-xs text-muted-foreground shadow-xs">
                <LayoutDashboard className="size-3.5 shrink-0" />
                <span className="truncate">
                  Talking about:{" "}
                  <span className="font-medium text-foreground">
                    {openDashboard.title ?? "this dashboard"}
                  </span>
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onCloseDashboard}
                      className="rounded-full p-0.5 hover:bg-accent hover:text-foreground"
                      aria-label="Close the dashboard"
                    >
                      <X className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Close the dashboard</TooltipContent>
                </Tooltip>
              </span>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm transition-shadow focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30">
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              placeholder={
                openDashboard ? "Ask for a change to this dashboard…" : "Describe a dashboard…"
              }
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) submit(event);
              }}
              className="field-sizing-content max-h-48 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
            />
            {running ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => running.abort()}
                    aria-label="Stop"
                  >
                    <Square className="size-3.5 fill-current" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stop</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                type="submit"
                size="icon"
                className="rounded-full"
                disabled={!input.trim()}
                aria-label="Send"
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Live data from npm, GitHub, and OSV.dev, loaded each time a dashboard opens.
          </p>
        </form>
      </div>
    </div>
  );
}

function AssistantMessage({
  item,
  thinking,
  renderDashboard,
}: {
  item: Extract<Item, { role: "assistant" }>;
  thinking: boolean;
  renderDashboard: (result: DashboardResult) => ReactNode;
}) {
  const last = item.parts.at(-1);
  // Show the dots while nothing new is streaming: before the first word, and while a tool runs.
  const waiting = thinking && !item.error && (!last || last.type === "dashboard");
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background shadow-xs">
        <Sparkles className="size-3.5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 text-[15px]">
        {item.parts.map((part, index) =>
          part.type === "text" ? (
            <div key={index}>
              <Markdown>{part.text}</Markdown>
            </div>
          ) : (
            <div key={part.result.key}>{renderDashboard(part.result)}</div>
          ),
        )}
        {waiting && <TypingIndicator />}
        {item.error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {item.error}
          </p>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex h-7 items-center gap-1" role="status" aria-label="Thinking">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="size-1.5 rounded-full bg-muted-foreground"
          style={{ animation: `typing 1.2s ${dot * 0.15}s infinite ease-in-out` }}
        />
      ))}
    </div>
  );
}

function Welcome({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center pt-8 text-center sm:pt-16">
      <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <LayoutDashboard className="size-6" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        OpenUI x ShadCN Dashboards
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-6 text-muted-foreground">
        Ask for a dashboard about any npm package or GitHub repository and watch it build from
        shadcn/ui components. Its numbers load live each time it opens, and you can change it by
        asking.
      </p>
      <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
        {starters.map(({ icon: Icon, title, detail, prompt }) => (
          <button
            key={title}
            type="button"
            onClick={() => onPick(prompt)}
            className={cn(
              "group flex flex-col items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-xs transition-colors",
              "hover:border-foreground/20 hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
            )}
          >
            <span className="flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
              <Icon className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-medium">{title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
