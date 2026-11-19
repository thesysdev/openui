import type { ActionEvent } from "@lynx-js/genui/openui";
import { BuiltinActionType, OpenUiRenderer } from "@lynx-js/genui/openui";
import { runOnBackground, useCallback, useEffect, useRef, useState } from "@lynx-js/react";
import type {
  BaseEvent,
  InputConfirmEvent,
  InputInputEvent,
  ListScrollEvent,
  NodesRef,
} from "@lynx-js/types";

import { OPENUI_API_URL } from "./config.js";
import { library } from "./library.js";
import type { ApiChatMessage, AssistantMessage, ChatMessage } from "./types.js";
import { useStreamingChat } from "./useStreamingChat.js";

import "./App.css";

const STARTERS = [
  {
    icon: "旅",
    label: "Kyoto itinerary",
    prompt:
      "Create a compact three-day Kyoto itinerary with morning, afternoon, and evening plans.",
  },
  {
    icon: "↗",
    label: "Launch checklist",
    prompt: "Build a polished launch-day checklist for a new mobile app, grouped by owner.",
  },
  {
    icon: "⚖",
    label: "Compare",
    prompt: "Compare React, Vue, and Svelte for a small product team in a concise visual summary.",
  },
  {
    icon: "✓",
    label: "Onboarding",
    prompt: "Design a friendly first-week onboarding plan for a new software engineer.",
  },
] as const;

let messageCounter = 0;
const nextMessageId = (role: "assistant" | "user") => `${role}-${Date.now()}-${++messageCounter}`;

function patchAssistant(messages: ChatMessage[], id: string, patch: Partial<AssistantMessage>) {
  return messages.map((message) =>
    message.id === id && message.role === "assistant" ? { ...message, ...patch } : message,
  );
}

export function App() {
  const { cancelStream, sendMessage: streamMessage } = useStreamingChat(OPENUI_API_URL);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [composerRevision, setComposerRevision] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const historyRef = useRef<ApiChatMessage[]>([]);
  const activeAssistantIdRef = useRef<string | null>(null);
  const listRef = useRef<NodesRef>(null);
  const messageCountRef = useRef(0);
  const autoFollowRef = useRef(true);
  messageCountRef.current = messages.length;

  const scrollToLatest = useCallback(() => {
    const index = messageCountRef.current - 1;
    if (index < 0 || !autoFollowRef.current) return;

    listRef.current
      ?.invoke({
        method: "scrollToPosition",
        params: { index, alignTo: "bottom", smooth: false },
      })
      .exec();
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(scrollToLatest, 0);
    return () => clearTimeout(timer);
  }, [messages, scrollToLatest]);

  const handleListScroll = useCallback((event: ListScrollEvent) => {
    "background only";
    const { listHeight, scrollHeight, scrollTop } = event.detail;
    autoFollowRef.current = scrollHeight - scrollTop - listHeight < 120;
  }, []);

  const sendMessage = useCallback(
    async (rawText: string) => {
      "background only";
      const text = rawText.trim();
      if (!text || activeAssistantIdRef.current) return;

      setNotice(null);
      autoFollowRef.current = true;

      const userMessage: ChatMessage = {
        id: nextMessageId("user"),
        role: "user",
        content: text,
      };
      const assistantId = nextMessageId("assistant");
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        status: "streaming",
      };
      const requestHistory: ApiChatMessage[] = [
        ...historyRef.current,
        { role: "user", content: text },
      ];

      historyRef.current = requestHistory;
      activeAssistantIdRef.current = assistantId;
      setMessages((current) => [...current, userMessage, assistantMessage]);
      setIsStreaming(true);

      try {
        const result = await streamMessage(requestHistory, (content) => {
          setMessages((current) => patchAssistant(current, assistantId, { content }));
        });

        if (result.status === "cancelled") {
          setMessages((current) =>
            patchAssistant(current, assistantId, {
              content: result.content,
              status: "stopped",
            }),
          );
          return;
        }

        if (!result.content.trim()) throw new Error("The model returned an empty response.");

        historyRef.current = [...requestHistory, { role: "assistant", content: result.content }];
        setMessages((current) =>
          patchAssistant(current, assistantId, {
            content: result.content,
            status: "complete",
          }),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "The request failed. Please try again.";
        setMessages((current) =>
          patchAssistant(current, assistantId, {
            error: message,
            status: "error",
          }),
        );
      } finally {
        if (activeAssistantIdRef.current === assistantId) {
          activeAssistantIdRef.current = null;
          setIsStreaming(false);
        }
      }
    },
    [streamMessage],
  );

  const submitDraft = useCallback(
    (value: string) => {
      "background only";
      if (!value.trim() || isStreaming) return;
      setDraft("");
      setComposerRevision((current) => current + 1);
      void sendMessage(value);
    },
    [isStreaming, sendMessage],
  );

  const updateDraft = useCallback((value: string) => {
    "background only";
    setDraft(value);
  }, []);

  const handleComposerInput = (event: BaseEvent<"bindinput", InputInputEvent>) => {
    "main thread";
    runOnBackground(updateDraft)(event.detail.value);
  };

  const handleComposerConfirm = useCallback(
    (event: BaseEvent<"bindconfirm", InputConfirmEvent>) => {
      "background only";
      submitDraft(event.detail.value);
    },
    [submitDraft],
  );

  const resetComposer = useCallback(() => {
    "background only";
    setDraft("");
    setComposerRevision((current) => current + 1);
  }, []);

  const submitComposer = useCallback(() => {
    "background only";
    if (!isStreaming && draft.trim()) submitDraft(draft);
  }, [draft, isStreaming, submitDraft]);

  const stopStreaming = useCallback(() => {
    "background only";
    const activeId = activeAssistantIdRef.current;
    if (!activeId) return;

    cancelStream();
    activeAssistantIdRef.current = null;
    setIsStreaming(false);
    setMessages((current) => patchAssistant(current, activeId, { status: "stopped" }));
  }, [cancelStream]);

  const clearConversation = useCallback(() => {
    "background only";
    cancelStream();
    historyRef.current = [];
    activeAssistantIdRef.current = null;
    autoFollowRef.current = true;
    setMessages([]);
    resetComposer();
    setIsStreaming(false);
    setNotice(null);
  }, [cancelStream, resetComposer]);

  const handleAction = useCallback(
    (event: ActionEvent) => {
      "background only";
      if (event.type === BuiltinActionType.ContinueConversation) {
        if (!isStreaming) void sendMessage(event.humanFriendlyMessage);
        return;
      }

      if (event.type === BuiltinActionType.OpenUrl) {
        const url = typeof event.params.url === "string" ? event.params.url : "the requested URL";
        setNotice(
          `Open URL requested: ${url}. Connect this action to your app's navigation bridge.`,
        );
      }
    },
    [isStreaming, sendMessage],
  );

  const firstUserMessage = messages.find((message) => message.role === "user");
  const threadTitle = firstUserMessage?.content ?? "New conversation";
  const composer = (
    <view className={`composer ${isStreaming ? "composer--busy" : ""}`}>
      <input
        key={composerRevision}
        className="composer-input"
        readonly={isStreaming || undefined}
        placeholder="Ask anything…"
        confirm-type="send"
        maxlength={2000}
        type="text"
        main-thread:bindinput={handleComposerInput}
        bindconfirm={handleComposerConfirm}
      />
      <view className="composer-action-row">
        <text className="composer-context">
          {isStreaming ? "Generating interface…" : "OpenUI Lang · ReactLynx"}
        </text>
        <view
          className={`send-button ${
            isStreaming ? "send-button--stop" : draft.trim() ? "" : "send-button--disabled"
          }`}
          bindtap={isStreaming ? stopStreaming : submitComposer}
        >
          <text className="send-button-text">{isStreaming ? "■" : "↑"}</text>
        </view>
      </view>
    </view>
  );

  return (
    <page>
      <view className={`app-shell ${__IS_WEB__ ? "app-shell--web" : "app-shell--native"}`}>
        {__IS_WEB__ && (
          <view className="agent-sidebar">
            <view className="sidebar-header">
              <text className="sidebar-brand">OpenUI Lynx</text>
            </view>

            <view className="sidebar-actions">
              <view className="new-chat-button" bindtap={clearConversation}>
                <view className="new-chat-icon">
                  <text className="new-chat-icon-text">＋</text>
                </view>
                <text className="new-chat-label">New chat</text>
              </view>
            </view>

            <view className="sidebar-divider" />

            <view className="sidebar-thread-section">
              <text className="sidebar-section-label">This session</text>
              {messages.length > 0 ? (
                <view className="sidebar-thread sidebar-thread--selected">
                  <text className="sidebar-thread-icon">▱</text>
                  <text className="sidebar-thread-title">{threadTitle}</text>
                </view>
              ) : (
                <text className="sidebar-empty">Your current conversation will appear here.</text>
              )}
            </view>

            <view className="sidebar-footer">
              <view className="runtime-avatar">
                <text className="runtime-avatar-text">L</text>
              </view>
              <view className="runtime-copy">
                <text className="runtime-name">ReactLynx</text>
                <text className="runtime-status">Local runtime</text>
              </view>
            </view>
          </view>
        )}

        <view className="thread-shell">
          {!__IS_WEB__ && (
            <view className="mobile-header">
              <view className="mobile-brand">
                <view className="mobile-logo">
                  <text className="mobile-logo-text">O</text>
                </view>
                <view className="mobile-brand-copy">
                  <text className="mobile-brand-title">OpenUI</text>
                  {isStreaming && <text className="mobile-brand-status">Generating…</text>}
                </view>
              </view>
              <view className="mobile-new-chat" bindtap={clearConversation}>
                <text className="mobile-new-chat-text">＋</text>
              </view>
            </view>
          )}

          <list
            ref={listRef}
            className="chat-list"
            list-type="single"
            scroll-orientation="vertical"
            span-count={1}
            scroll-bar-enable={false}
            bindscroll={handleListScroll}
            bindlayoutcomplete={scrollToLatest}
          >
            {messages.length === 0 ? (
              <list-item
                item-key="welcome"
                key="welcome"
                recyclable={false}
                className="welcome-item"
              >
                <view className="welcome-card">
                  <view className="welcome-mark">
                    <text className="welcome-mark-text">O</text>
                  </view>
                  <view className="welcome-copy">
                    <text className="welcome-title">What can I help you build?</text>
                    <text className="welcome-subtitle">
                      Ask for an interface, workflow, or structured answer — or pick a starter
                      below.
                    </text>
                  </view>

                  {__IS_WEB__ && <view className="welcome-composer">{composer}</view>}

                  {!draft.trim() && (
                    <view
                      className={`starter-grid ${
                        __IS_WEB__ ? "starter-grid--web" : "starter-grid--native"
                      }`}
                    >
                      {STARTERS.map((starter) => (
                        <view
                          key={starter.prompt}
                          className={`starter-card ${
                            __IS_WEB__ ? "starter-card--web" : "starter-card--native"
                          }`}
                          bindtap={() => void sendMessage(starter.prompt)}
                        >
                          <text className="starter-icon-text">{starter.icon}</text>
                          <text className="starter-label">{starter.label}</text>
                        </view>
                      ))}
                    </view>
                  )}
                </view>
              </list-item>
            ) : (
              messages.map((message) => (
                <list-item
                  item-key={message.id}
                  key={message.id}
                  recyclable={false}
                  className="message-item"
                >
                  <view className="message-rail">
                    {message.role === "user" ? (
                      <view className="user-message-row">
                        <view className="user-bubble">
                          <text className="user-bubble-text">{message.content}</text>
                        </view>
                      </view>
                    ) : (
                      <view className="assistant-message">
                        {message.status === "streaming" && message.content && (
                          <text className="assistant-progress">Generating…</text>
                        )}

                        {message.content ? (
                          <view
                            className={`assistant-surface luna-light ${
                              __IS_WEB__ ? "assistant-surface--web" : ""
                            }`}
                          >
                            <OpenUiRenderer
                              response={message.content}
                              library={library}
                              isStreaming={message.status === "streaming"}
                              onAction={handleAction}
                              onError={(errors) =>
                                console.error(`OpenUI render error in ${message.id}`, errors)
                              }
                            />
                          </view>
                        ) : message.status === "error" ? (
                          <view className="error-card">
                            <text className="error-title">Couldn’t generate a response</text>
                            <text className="error-message">{message.error}</text>
                          </view>
                        ) : (
                          <view className="typing-indicator">
                            <text className="typing-label">Thinking</text>
                            <view className="typing-dot typing-dot--one" />
                            <view className="typing-dot typing-dot--two" />
                            <view className="typing-dot typing-dot--three" />
                          </view>
                        )}

                        {message.status === "stopped" && (
                          <text className="assistant-stopped">Generation stopped</text>
                        )}

                        {message.status === "error" && message.content && (
                          <view className="error-card error-card--below">
                            <text className="error-message">{message.error}</text>
                          </view>
                        )}
                      </view>
                    )}
                  </view>
                </list-item>
              ))
            )}
          </list>

          {notice && (
            <view className="action-notice">
              <text className="action-notice-text">{notice}</text>
              <view className="action-notice-close" bindtap={() => setNotice(null)}>
                <text className="action-notice-close-text">×</text>
              </view>
            </view>
          )}

          {(messages.length > 0 || !__IS_WEB__) && (
            <view className="composer-wrap">
              <view className="composer-rail">{composer}</view>
            </view>
          )}
        </view>
      </view>
    </page>
  );
}
