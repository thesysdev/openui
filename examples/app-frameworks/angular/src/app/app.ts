import { Component, TemplateRef, computed, signal, viewChild } from "@angular/core";
import { Renderer, type ActionEvent, type OpenUIError } from "@openuidev/angular-lang";
import {
  NxBubbleListComponent,
  type NxBubbleListItem,
  type NxBubbleSlotType,
} from "ng-zorro-x/bubble";
import {
  NxConversationsComponent,
  type NxConversation,
  type NxConversationMenuProps,
} from "ng-zorro-x/conversations";
import { NxSenderComponent } from "ng-zorro-x/sender";
import { library } from "./openui/library";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "streaming" | "done" | "stopped" | "error";
  error?: string;
  renderErrors?: string[];
};
type Thread = { id: string; title: string; messages: Message[]; updatedAt: number };
const storageKey = "openui-angular-agent-chat-v1";
const newThread = (): Thread => ({
  id: crypto.randomUUID(),
  title: "New conversation",
  messages: [],
  updatedAt: Date.now(),
});

@Component({
  selector: "app-root",
  imports: [Renderer, NxBubbleListComponent, NxSenderComponent, NxConversationsComponent],
  templateUrl: "./app.html",
})
export class App {
  private readonly composer = viewChild(NxSenderComponent);
  private readonly assistantContent = viewChild<TemplateRef<NxBubbleSlotType>>("assistantContent");
  private readonly assistantHeader = viewChild<TemplateRef<NxBubbleSlotType>>("assistantHeader");
  readonly library = library;
  readonly threads = signal<Thread[]>([]);
  readonly activeId = signal("");
  readonly current = computed(() => this.threads().find((thread) => thread.id === this.activeId()));
  readonly draft = signal("");
  readonly busy = signal(false);
  readonly sidebarOpen = signal(false);
  readonly connection = signal<{ configured: boolean; model: string } | null>(null);
  readonly connectionError = signal("");
  readonly storageWarning = signal("");
  private controller?: AbortController;
  readonly conversationItems = computed<NxConversation[]>(() =>
    this.threads().map((thread) => ({
      key: thread.id,
      label: thread.title,
      timestamp: thread.updatedAt,
    })),
  );
  readonly conversationMenu = (conversation: NxConversation): NxConversationMenuProps => ({
    items: [{ key: "delete", label: "Delete conversation", danger: true }],
    onClick: () => this.deleteThread(conversation.key),
  });
  readonly bubbleItems = computed<NxBubbleListItem[]>(() =>
    (this.current()?.messages ?? []).map((message) => ({
      key: message.id,
      role: message.role,
      content: message.content,
      placement: message.role === "user" ? "end" : "start",
      variant: message.role === "user" ? "filled" : "borderless",
      shape: "corner",
      typing: false,
      loading: message.role === "assistant" && message.status === "streaming" && !message.content,
      headerRender: message.role === "assistant" ? this.assistantHeader() : undefined,
      messageRender: message.role === "assistant" ? this.assistantContent() : undefined,
    })),
  );
  getMessage(key: string | number | undefined): Message | undefined {
    return this.current()?.messages.find((message) => message.id === key);
  }
  readonly starters = [
    {
      icon: "▥",
      label: "Make sense of my data",
      description: "Turn numbers into a clear story",
      prompt:
        "Analyze our monthly signups: January 120, February 165, March 148, April 210, May 260, June 315. Show a bar chart, key metrics, and useful next steps.",
    },
    {
      icon: "⇄",
      label: "Compare my options",
      description: "See the tradeoffs side by side",
      prompt:
        "Compare Angular, React, and Vue for a small team building an internal business dashboard. Show a practical comparison table and ask me about my team's needs.",
    },
    {
      icon: "✓",
      label: "Put a plan together",
      description: "Go from an idea to next steps",
      prompt:
        "Help me plan a focused two-week sprint to launch a personal portfolio. Give me an interactive checklist and a simple schedule.",
    },
    {
      icon: "↗",
      label: "Plan a weekend away",
      description: "Start with what matters to you",
      prompt:
        "Help me plan a weekend getaway. First ask about my departure city, budget, and interests using a short form.",
    },
  ];

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved && Array.isArray(saved.threads)) {
        const restored = saved.threads
          .filter(
            (thread: any) =>
              typeof thread?.id === "string" &&
              typeof thread.title === "string" &&
              Array.isArray(thread.messages),
          )
          .slice(0, 30)
          .map((thread: Thread) => ({
            ...thread,
            messages: thread.messages
              .filter(
                (message) =>
                  message &&
                  ["user", "assistant"].includes(message.role) &&
                  typeof message.content === "string" &&
                  typeof message.id === "string",
              )
              .map((message) => ({
                ...message,
                status: message.status === "streaming" ? ("stopped" as const) : message.status,
              })),
          }));
        this.threads.set(restored);
        this.activeId.set(
          restored.some((thread: Thread) => thread.id === saved.activeId)
            ? saved.activeId
            : (restored[0]?.id ?? ""),
        );
      }
    } catch {
      this.storageWarning.set("Conversation storage is unavailable in this browser.");
    }
    if (!this.threads().length) this.newChat();
    void this.checkConnection();
  }

  async checkConnection(): Promise<void> {
    try {
      const response = await fetch("/api/health");
      if (!response.ok) throw new Error();
      this.connection.set(await response.json());
      this.connectionError.set("");
    } catch {
      this.connectionError.set(
        "The local chat server is unavailable. Restart the development server to reconnect.",
      );
    }
  }

  newChat(): void {
    this.stop();
    const empty = this.threads().find((thread) => !thread.messages.length);
    const thread = empty ?? newThread();
    if (!empty) this.threads.update((threads) => [thread, ...threads].slice(0, 30));
    this.activeId.set(thread.id);
    this.draft.set("");
    this.sidebarOpen.set(false);
    this.persist();
    this.focusComposer();
  }
  selectThread(id: string): void {
    this.stop();
    this.activeId.set(id);
    this.sidebarOpen.set(false);
    this.draft.set("");
    this.persist();
  }
  deleteThread(id: string): void {
    if (id === this.activeId()) this.stop();
    this.threads.update((threads) => threads.filter((thread) => thread.id !== id));
    if (id === this.activeId()) this.activeId.set(this.threads()[0]?.id ?? "");
    if (!this.threads().length) this.newChat();
    this.persist();
  }
  stop(): void {
    this.controller?.abort();
  }
  onAction(event: ActionEvent): void {
    if (!this.busy() && event.humanFriendlyMessage) void this.send(event.humanFriendlyMessage);
  }
  onRenderErrors(id: string, errors: OpenUIError[]): void {
    const thread = this.current();
    const message = thread?.messages.find((item) => item.id === id);
    const next = errors.map((error) => error.message);
    if (thread && message && JSON.stringify(message.renderErrors ?? []) !== JSON.stringify(next))
      this.updateMessage(thread.id, id, { renderErrors: next });
  }
  retry(id: string): void {
    if (this.busy()) return;
    const thread = this.current();
    const index = thread?.messages.findIndex((message) => message.id === id) ?? -1;
    if (!thread || index < 1 || index !== thread.messages.length - 1) return;
    const user = thread.messages[index - 1];
    if (user.role !== "user") return;
    this.threads.update((threads) =>
      threads.map((item) =>
        item.id === thread.id ? { ...item, messages: item.messages.slice(0, index - 1) } : item,
      ),
    );
    void this.send(user.content);
  }

  async send(value = this.draft()): Promise<void> {
    const text = value.trim();
    if (!text || this.busy()) return;
    const thread = this.current();
    if (!thread) return;
    const controller = new AbortController();
    this.controller = controller;
    const user: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const assistant: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      status: "streaming",
    };
    const history = [
      ...thread.messages.filter((message) => message.role === "user" || message.status === "done"),
      user,
    ]
      .slice(-39)
      .map(({ role, content }) => ({ role, content }));
    this.threads.update((threads) =>
      threads.map((item) =>
        item.id === thread.id
          ? {
              ...item,
              title: item.messages.length ? item.title : text.slice(0, 65),
              updatedAt: Date.now(),
              messages: [...item.messages, user, assistant],
            }
          : item,
      ),
    );
    this.draft.set("");
    this.busy.set(true);
    this.persist();
    let content = "";
    let completed = false;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? `Chat request failed (${response.status}).`);
      }
      if (!response.body) throw new Error("The chat server returned an empty response.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const handle = (line: string): void => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.type === "delta") {
          content += event.text;
          this.updateMessage(thread.id, assistant.id, { content });
        } else if (event.type === "done") completed = true;
        else if (event.type === "error") throw new Error(event.message);
      };
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          let newline;
          while ((newline = buffer.indexOf("\n")) !== -1) {
            handle(buffer.slice(0, newline));
            buffer = buffer.slice(newline + 1);
          }
        }
        buffer += decoder.decode();
        handle(buffer);
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      if (!completed)
        throw new Error("The connection ended before the reply finished. Please retry.");
      this.updateMessage(thread.id, assistant.id, { status: "done" });
    } catch (error) {
      this.updateMessage(
        thread.id,
        assistant.id,
        controller.signal.aborted
          ? { status: "stopped" }
          : {
              status: "error",
              error: error instanceof Error ? error.message : "Something went wrong. Please retry.",
            },
      );
    } finally {
      if (this.controller === controller) {
        this.controller = undefined;
        this.busy.set(false);
      }
      this.persist();
      this.focusComposer();
    }
  }

  private updateMessage(threadId: string, messageId: string, patch: Partial<Message>): void {
    this.threads.update((threads) =>
      threads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              messages: thread.messages.map((message) =>
                message.id === messageId ? { ...message, ...patch } : message,
              ),
            }
          : thread,
      ),
    );
  }
  private persist(): void {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ threads: this.threads(), activeId: this.activeId() }),
      );
    } catch {
      this.storageWarning.set(
        "Browser storage is full or unavailable. This conversation may not survive a reload.",
      );
    }
  }
  private focusComposer(): void {
    requestAnimationFrame(() => this.composer()?.focus({ preventScroll: true }));
  }
}
