import type { ActionEvent } from "@openuidev/react-lang";
import { BuiltinActionType, Renderer } from "@openuidev/react-lang";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import type { UIMessage } from "ai";
import { Bot } from "lucide-react";
import { ToolCallIndicator } from "./tool-call-indicator";

interface AssistantMessageProps {
  message: UIMessage;
  isStreaming: boolean;
  onSend: (text: string) => void;
}

function isToolPart(
  part: UIMessage["parts"][number],
): part is UIMessage["parts"][number] & { toolCallId: string; state: string } {
  return part.type.startsWith("tool-") || part.type === "dynamic-tool";
}

function getToolName(part: UIMessage["parts"][number]): string {
  if (part.type === "dynamic-tool" && "toolName" in part) {
    return (part as { toolName: string }).toolName;
  }
  return part.type.replace(/^tool-/, "");
}

export function AssistantMessage({ message, isStreaming, onSend }: AssistantMessageProps) {
  const textContent = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  const toolParts = message.parts.filter(isToolPart);

  const handleAction = (event: ActionEvent) => {
    if (event.type === BuiltinActionType.ContinueConversation && event.humanFriendlyMessage) {
      onSend(event.humanFriendlyMessage);
    }
  };

  const isToolDone = (state: string) => state === "output-available";

  return (
    <div className="flex gap-3 max-w-3xl">
      <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
        <Bot size={14} className="text-white" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        {toolParts.map((tp) => (
          <ToolCallIndicator
            key={(tp as { toolCallId: string }).toolCallId}
            name={getToolName(tp)}
            isDone={isToolDone((tp as { state: string }).state)}
          />
        ))}
        {textContent && (
          <div className="prose-container">
            <Renderer
              response={textContent}
              library={openuiChatLibrary}
              isStreaming={isStreaming}
              onAction={handleAction}
            />
          </div>
        )}
      </div>
    </div>
  );
}
