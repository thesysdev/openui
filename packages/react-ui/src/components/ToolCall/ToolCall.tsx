import type { ToolCall } from "@openuidev/react-headless";
import clsx from "clsx";
import { ChevronDown, SquareCode } from "lucide-react";
import { useState } from "react";

export interface ToolCallProps {
  toolCall: ToolCall;
  isStreaming?: boolean;
  /** True once tool work is done (e.g. text content has started rendering) */
  toolsDone?: boolean;
  isLast?: boolean;
  className?: string;
}

export const ToolCallComponent = ({
  toolCall,
  isStreaming,
  toolsDone,
  isLast = false,
  className,
}: ToolCallProps) => {
  const isRunning = !!isStreaming && !toolsDone;
  const actionLabel = isRunning
    ? `Calling the ${toolCall.function.name} tool`
    : `Called the ${toolCall.function.name} tool`;

  let parsedArgs: { _request?: unknown; _response?: unknown } | null = null;
  try {
    parsedArgs = JSON.parse(toolCall.function.arguments);
  } catch {
    // not parseable yet
  }

  const hasRequest = parsedArgs && parsedArgs._request != null;
  const hasResponse = parsedArgs && parsedArgs._response != null;
  const requestStr = hasRequest ? JSON.stringify(parsedArgs!._request, null, 2) : null;
  const responseStr = hasResponse ? JSON.stringify(parsedArgs!._response, null, 2) : null;

  const plainArgs =
    !hasRequest && !hasResponse && toolCall.function.arguments
      ? (() => {
          try {
            return JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2);
          } catch {
            return toolCall.function.arguments;
          }
        })()
      : null;

  return (
    <div className={clsx("openui-tool-call", className)}>
      <div className="openui-tool-call__title-row">
        <span
          className={clsx("openui-tool-call__icon-wrapper", {
            "openui-tool-call__icon--blinking": isRunning && isLast,
          })}
        >
          <SquareCode size={14} className="openui-tool-call__icon" />
        </span>
        <span
          className={clsx("openui-tool-call__name", {
            "openui-tool-call__name--shimmer": isRunning && isLast,
          })}
        >
          {actionLabel}
        </span>
      </div>
      <div
        className={clsx("openui-tool-call__connector", {
          "openui-tool-call__connector--last": isLast,
        })}
      >
        <div className="openui-tool-call__args-block">
          {requestStr && (
            <ToolCodeBlock
              type="request"
              code={requestStr}
              isRunning={isRunning && !hasResponse}
              toolName={toolCall.function.name}
            />
          )}
          {responseStr && (
            <ToolCodeBlock
              type="response"
              code={responseStr}
              isRunning={isRunning && isLast}
              toolName={toolCall.function.name}
            />
          )}
          {plainArgs && (
            <ToolCodeBlock
              type="request"
              code={plainArgs}
              isRunning={isRunning}
              toolName={toolCall.function.name}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ── Expandable code block (request / response) ──

interface ToolCodeBlockProps {
  type: "request" | "response";
  code: string;
  isRunning?: boolean;
  toolName: string;
}

const ToolCodeBlock = ({ type, code, isRunning = false, toolName }: ToolCodeBlockProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const label = type === "request" ? "Tool Request" : "Tool Response";
  const runningLabel =
    type === "request"
      ? `Sending request to ${toolName}...`
      : `Awaiting response from ${toolName}...`;

  return (
    <div className="openui-tool-code-block">
      <button
        className="openui-tool-code-block__header"
        onClick={() => setIsExpanded((v) => !v)}
        type="button"
      >
        <span
          className={clsx("openui-tool-code-block__label", {
            "openui-tool-code-block__label--loading": isRunning,
          })}
        >
          {isRunning ? runningLabel : label}
        </span>
        <ChevronDown
          size={14}
          className={clsx("openui-tool-code-block__chevron", {
            "openui-tool-code-block__chevron--expanded": isExpanded,
          })}
        />
      </button>
      {isExpanded && (
        <div className="openui-tool-code-block__content">
          <pre className="openui-tool-code-block__code">{code}</pre>
        </div>
      )}
    </div>
  );
};
