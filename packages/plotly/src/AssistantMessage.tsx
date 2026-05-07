"use client";
import type { AssistantMessage as AssistantMessageType } from "@openuidev/react-headless";
import type { Library } from "@openuidev/react-lang";
import { Renderer } from "@openuidev/react-lang";
import React from "react";

interface Props {
  message: AssistantMessageType;
  isStreaming: boolean;
  library: Library;
}

interface ErrorBoundaryState {
  err: Error | null;
}

class MessageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { err: null };
  static getDerivedStateFromError(err: Error): ErrorBoundaryState {
    return { err };
  }
  override componentDidCatch(err: Error) {
    if (typeof window !== "undefined") {
      console.error("[plotly] message render crashed:", err);
    }
  }
  override render() {
    if (this.state.err) {
      return (
        <div
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px dashed rgba(239,68,68,0.3)",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 12.5,
            color: "rgba(127,29,29,0.95)",
            lineHeight: 1.45,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>Render error</div>
          <div style={{ color: "rgba(127,29,29,0.7)", fontSize: 11.5 }}>
            {this.state.err.message}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function PlotlyAssistantMessage({ message, isStreaming, library }: Props) {
  const content = typeof message.content === "string" ? message.content : "";

  React.useEffect(() => {
    if (!isStreaming && content) {
      // eslint-disable-next-line no-console
      console.groupCollapsed(
        `%c[plotly] openui-lang (${content.length} chars)`,
        "color:#4c78a8;font-weight:600",
      );
      // eslint-disable-next-line no-console
      console.log(content);
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  }, [isStreaming, content]);

  return (
    <div style={{ width: "100%" }}>
      <MessageErrorBoundary>
        <Renderer
          response={content}
          library={library}
          isStreaming={isStreaming}
          onError={(errors) => {
            if (errors.length === 0) return;
            console.warn(
              `%c[plotly] ${errors.length} render error(s)`,
              "color:#dc2626;font-weight:600",
              errors,
            );
          }}
          // onParseResult intentionally omitted — it fires on every reactive
          // state change which spams the console with N×M log lines on multi-
          // chart messages. Re-enable behind a debug flag if needed.
        />
      </MessageErrorBoundary>
    </div>
  );
}
