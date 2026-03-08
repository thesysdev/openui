import type { AssistantMessage, Message, ToolMessage } from "@openuidev/react-headless";
import { MessageProvider, useThread } from "@openuidev/react-headless";
import clsx from "clsx";
import { ArrowUp, Square } from "lucide-react";
import React, { memo, useEffect, useLayoutEffect, useRef } from "react";
import { useComposerState } from "../../hooks/useComposerState";
import { ScrollVariant, useScrollToBottom } from "../../hooks/useScrollToBottom";
import { IconButton } from "../IconButton";
import { MarkDownRenderer } from "../MarkDownRenderer";
import { MessageLoading as MessageLoadingComponent } from "../MessageLoading";
import type { AssistantMessageComponent, UserMessageComponent } from "../OpenUIChat/types";
import { useShellStore } from "../Shell/store";
import { ToolCallComponent } from "../ToolCall";
import { ToolResult } from "../ToolResult";

export const ThreadContainer = ({
  children,
  className,
  isArtifactActive = false,
  renderArtifact = () => null,
}: {
  children?: React.ReactNode;
  className?: string;
  isArtifactActive?: boolean;
  renderArtifact?: () => React.ReactNode;
}) => {
  const { setIsArtifactActive, setArtifactRenderer } = useShellStore((state) => ({
    setIsArtifactActive: state.setIsArtifactActive,
    setArtifactRenderer: state.setArtifactRenderer,
  }));

  useEffect(() => {
    setIsArtifactActive(isArtifactActive);
    setArtifactRenderer(renderArtifact);
  }, [isArtifactActive, setIsArtifactActive]);

  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  return (
    <div
      className={clsx("openui-copilot-shell-thread-container", className)}
      style={{
        visibility: isLoadingMessages ? "hidden" : undefined,
      }}
    >
      {children}
    </div>
  );
};

export const ScrollArea = ({
  children,
  className,
  scrollVariant = "user-message-anchor",
  userMessageSelector = ".openui-copilot-shell-thread-message-user",
}: {
  children?: React.ReactNode;
  className?: string;
  /**
   * Scroll to bottom once the last message is added
   */
  scrollVariant?: ScrollVariant;
  /**
   * Selector for the user message
   */
  userMessageSelector?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);
  const { isArtifactActive, artifactRenderer } = useShellStore((store) => ({
    isArtifactActive: store.isArtifactActive,
    artifactRenderer: store.artifactRenderer,
  }));

  useScrollToBottom({
    ref,
    lastMessage: messages[messages.length - 1] || { id: "" },
    scrollVariant,
    userMessageSelector,
    isRunning,
    isLoadingMessages,
  });

  return (
    <div className="openui-copilot-shell-thread-scroll-container">
      <div
        ref={ref}
        className={clsx(
          "openui-copilot-shell-thread-scroll-area",
          {
            "openui-copilot-shell-thread-scroll-area--user-message-anchor":
              scrollVariant === "user-message-anchor",
          },
          className,
        )}
      >
        {children}
      </div>
      {isArtifactActive && (
        <div className="openui-copilot-shell-thread-artifact-panel--mobile">
          {artifactRenderer()}
        </div>
      )}
    </div>
  );
};

export const AssistantMessageContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={clsx("openui-copilot-shell-thread-message-assistant", className)}>
      <div className="openui-copilot-shell-thread-message-assistant__content">{children}</div>
    </div>
  );
};

export const UserMessageContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={clsx("openui-copilot-shell-thread-message-user", className)}>
      <div className="openui-copilot-shell-thread-message-user__content">{children}</div>
    </div>
  );
};

const AssistantMessageContent = ({
  message,
  allMessages,
}: {
  message: AssistantMessage;
  allMessages: Message[];
}) => {
  const getToolName = (toolCallId: string) => {
    const toolCall = message.toolCalls?.find((tc) => tc.id === toolCallId);
    return toolCall?.function.name;
  };

  const toolMessages: ToolMessage[] = [];
  const msgIndex = allMessages.findIndex((m) => m.id === message.id);
  if (msgIndex !== -1) {
    for (let i = msgIndex + 1; i < allMessages.length; i++) {
      const m = allMessages[i];
      if (m && m.role === "tool") {
        toolMessages.push(m as ToolMessage);
      } else {
        break;
      }
    }
  }

  return (
    <>
      {message.content && (
        <MarkDownRenderer
          textMarkdown={message.content}
          className="openui-copilot-shell-thread-message-assistant__text"
        />
      )}
      {message.toolCalls?.map((toolCall) => (
        <ToolCallComponent key={toolCall.id} toolCall={toolCall} />
      ))}
      {toolMessages.map((tm) => (
        <ToolResult key={tm.id} message={tm} toolName={getToolName(tm.toolCallId)} />
      ))}
    </>
  );
};

const UserMessageContent = ({ message }: { message: Message }) => {
  if (message.role !== "user") return null;
  const content = message.content;
  if (typeof content === "string") {
    return <>{content}</>;
  }
  return (
    <>
      {content?.map((part, i) => {
        if (part.type === "text") {
          return <span key={i}>{part.text}</span>;
        }
        if (part.type === "binary" && part.url) {
          return (
            <img
              key={i}
              src={part.url}
              alt=""
              className="openui-copilot-shell-thread-message-user__image"
            />
          );
        }
        return null;
      })}
    </>
  );
};

export const RenderMessage = memo(
  ({
    message,
    className,
    allMessages,
    assistantMessage: CustomAssistantMessage,
    userMessage: CustomUserMessage,
  }: {
    message: Message;
    className?: string;
    allMessages: Message[];
    assistantMessage?: AssistantMessageComponent;
    userMessage?: UserMessageComponent;
  }) => {
    if (message.role === "tool") {
      return null;
    }

    if (message.role === "assistant") {
      if (CustomAssistantMessage) {
        return <CustomAssistantMessage message={message} />;
      }
      return (
        <AssistantMessageContainer className={className}>
          <AssistantMessageContent message={message} allMessages={allMessages} />
        </AssistantMessageContainer>
      );
    }

    if (message.role === "user") {
      if (CustomUserMessage) {
        return <CustomUserMessage message={message} />;
      }
      return (
        <UserMessageContainer className={className}>
          <UserMessageContent message={message} />
        </UserMessageContainer>
      );
    }

    return null;
  },
);

export const MessageLoading = () => {
  return (
    <div className="openui-copilot-shell-thread-message-loading">
      <MessageLoadingComponent />
    </div>
  );
};

export const Messages = ({
  className,
  loader,
  assistantMessage,
  userMessage,
}: {
  className?: string;
  loader?: React.ReactNode;
  assistantMessage?: AssistantMessageComponent;
  userMessage?: UserMessageComponent;
}) => {
  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);

  return (
    <div className={clsx("openui-copilot-shell-thread-messages", className)}>
      {messages.map((message) => {
        return (
          <MessageProvider key={message.id} message={message}>
            <RenderMessage
              message={message}
              allMessages={messages}
              assistantMessage={assistantMessage}
              userMessage={userMessage}
            />
          </MessageProvider>
        );
      })}
      {isRunning && <div>{loader}</div>}
    </div>
  );
};

export const Composer = ({ className }: { className?: string }) => {
  const { textContent, setTextContent } = useComposerState();
  const processMessage = useThread((s) => s.processMessage);
  const cancelMessage = useThread((s) => s.cancelMessage);
  const isRunning = useThread((s) => s.isRunning);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!textContent.trim() || isRunning) {
      return;
    }

    processMessage({
      role: "user",
      content: textContent,
    });

    setTextContent("");
  };

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [textContent]);

  return (
    <div className={clsx("openui-copilot-shell-thread-composer", className)}>
      <div className="openui-copilot-shell-thread-composer__input-wrapper">
        <textarea
          ref={inputRef}
          autoFocus
          rows={1}
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="openui-copilot-shell-thread-composer__input"
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <IconButton
          onClick={isRunning ? cancelMessage : handleSubmit}
          icon={isRunning ? <Square size="1em" fill="currentColor" /> : <ArrowUp size="1em" />}
        />
      </div>
    </div>
  );
};
