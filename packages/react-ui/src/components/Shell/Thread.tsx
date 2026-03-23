import type { AssistantMessage, Message, ToolMessage } from "@openuidev/react-headless";
import { MessageProvider, useThread } from "@openuidev/react-headless";
import clsx from "clsx";
import React, { memo, useEffect, useRef } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { ScrollVariant, useScrollToBottom } from "../../hooks/useScrollToBottom";
import { Callout } from "../Callout";
import { MarkDownRenderer } from "../MarkDownRenderer";
import { MessageLoading as MessageLoadingComponent } from "../MessageLoading";
import type { AssistantMessageComponent, UserMessageComponent } from "../OpenUIChat/types";
import { ToolCallComponent } from "../ToolCall";
import { ToolResult } from "../ToolResult";
import { ResizableSeparator } from "./ResizableSeparator";
import { useShellStore } from "./store";
import { useArtifactResize } from "./useArtifactResize";

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
  const { layout } = useLayoutContext();
  const isMobile = layout === "mobile";

  const { setIsSidebarOpen, setIsArtifactActive, setArtifactRenderer } = useShellStore((state) => ({
    setIsSidebarOpen: state.setIsSidebarOpen,
    setIsArtifactActive: state.setIsArtifactActive,
    setArtifactRenderer: state.setArtifactRenderer,
  }));

  // Sync artifact state and renderer with store
  useEffect(() => {
    setIsArtifactActive(isArtifactActive);
    setArtifactRenderer(renderArtifact);
  }, [isArtifactActive, renderArtifact, setIsArtifactActive, setArtifactRenderer]);

  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  const {
    containerRef,
    chatPanelRef,
    artifactPanelRef,
    isDragging,
    handleResize,
    handleDragStart,
    handleDragEnd,
  } = useArtifactResize({
    isArtifactActive,
    isMobile,
    setIsSidebarOpen,
  });

  return (
    <div
      className={clsx("openui-shell-thread-container", className, {
        "openui-shell-thread-container--artifact-active": isArtifactActive,
      })}
      style={{
        visibility: isLoadingMessages ? "hidden" : undefined,
      }}
    >
      <div className="openui-shell-thread-wrapper" ref={containerRef}>
        {/* Chat panel - always visible */}
        <div
          ref={chatPanelRef}
          className={clsx("openui-shell-thread-chat-panel", {
            "openui-shell-thread-chat-panel--animating": !isDragging,
          })}
        >
          {children}
        </div>

        {/* Desktop only: Resizable separator and artifact panel */}
        {!isMobile && isArtifactActive && (
          <>
            <ResizableSeparator
              onResize={handleResize}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
            <div
              ref={artifactPanelRef}
              className={clsx("openui-shell-thread-artifact-panel", {
                "openui-shell-thread-artifact-panel--animating": !isDragging,
              })}
            >
              {renderArtifact?.()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const ScrollArea = ({
  children,
  className,
  scrollVariant = "user-message-anchor",
  userMessageSelector,
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
  const { layout } = useLayoutContext();
  const isMobile = layout === "mobile";

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
    <div className="openui-shell-thread-scroll-container">
      <div
        ref={ref}
        className={clsx(
          "openui-shell-thread-scroll-area",
          {
            "openui-shell-thread-scroll-area--user-message-anchor":
              scrollVariant === "user-message-anchor",
          },
          className,
        )}
      >
        {children}
      </div>
      {isMobile && isArtifactActive && (
        <div className="openui-shell-thread-artifact-panel--mobile">{artifactRenderer()}</div>
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
  const { logoUrl } = useShellStore((store) => ({
    logoUrl: store.logoUrl,
  }));

  return (
    <div className={clsx("openui-shell-thread-message-assistant", className)}>
      <img src={logoUrl} alt="Assistant" className="openui-shell-thread-message-assistant__logo" />
      <div className="openui-shell-thread-message-assistant__content">{children}</div>
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
    <div className={clsx("openui-shell-thread-message-user", className)}>
      <div className="openui-shell-thread-message-user__content">{children}</div>
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
  // Find tool result messages that correspond to this message's tool calls
  const getToolName = (toolCallId: string) => {
    const toolCall = message.toolCalls?.find((tc) => tc.id === toolCallId);
    return toolCall?.function.name;
  };

  // Collect tool messages that follow this assistant message
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
          className="openui-shell-thread-message-assistant__text"
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
  // InputContent[] — render text parts
  return (
    <>
      {content?.map((part, i) => {
        if (part.type === "text") {
          return <span key={i}>{part.text}</span>;
        }
        // Binary content — could be image, file, etc.
        if (part.type === "binary" && part.url) {
          return (
            <img
              key={i}
              src={part.url}
              alt=""
              className="openui-shell-thread-message-user__image"
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
      // Tool messages are rendered inline with their parent assistant message
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

    // Other roles (system, developer, reasoning, activity) — skip by default
    return null;
  },
);

export const MessageLoading = () => {
  return (
    <div className="openui-shell-thread-message-loading">
      <MessageLoadingComponent />
    </div>
  );
};

export const ThreadError = () => {
  const threadError = useThread((s) => s.threadError);
  if (!threadError) return null;

  return (
    <div className="openui-shell-thread-error">
      <Callout
        variant="danger"
        title="Something went wrong"
        description={threadError.message || "An unexpected error occurred. Please try again."}
      />
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
  const threadError = useThread((s) => s.threadError);

  return (
    <div className={clsx("openui-shell-thread-messages", className)}>
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
      {!isRunning && threadError && <ThreadError />}
    </div>
  );
};

export const ThreadHeader = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return <div className={clsx("openui-shell-thread-header", className)}>{children}</div>;
};

// Re-export Composer from components
export { Composer } from "./components";
