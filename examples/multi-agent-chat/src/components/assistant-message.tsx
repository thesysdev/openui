import type { ActionEvent } from "@openuidev/react-lang";
import { BuiltinActionType, Renderer } from "@openuidev/react-lang";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import type { UIMessage } from "ai";
import { Bot } from "lucide-react";
import { ToolCallIndicator } from "./tool-call-indicator";

interface AssistantMessageProps {
  message: UIMessage;
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

function getOpenUiToolOutput(part: UIMessage["parts"][number]): string | null {
  if (!("output" in part)) return null;
  const output = (part as { output?: unknown }).output;
  if (!output || typeof output !== "object") return null;

  const openuiSpec = (output as { openuiSpec?: unknown }).openuiSpec;
  return typeof openuiSpec === "string" ? openuiSpec : null;
}


function isOpenUiToolOutputStreaming(part: UIMessage["parts"][number]): boolean {
  if (!("output" in part)) return false;
  const output = (part as { output?: unknown }).output;
  if (!output || typeof output !== "object") return false;

  return (output as { complete?: unknown }).complete === false;
}

export function AssistantMessage({ message, onSend }: AssistantMessageProps) {
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
        {toolParts.map((tp) => {
          const toolState = (tp as { state: string }).state;
          const toolName = getToolName(tp);
          const openUiSpec = getOpenUiToolOutput(tp);
<<<<<<< HEAD
          const isOpenUiStreaming = isOpenUiToolOutputStreaming(tp);
=======
>>>>>>> 5e51dcdf (added multi-agent exampl)

          return (
            <div key={(tp as { toolCallId: string }).toolCallId} className="space-y-2">
              <ToolCallIndicator name={toolName} isDone={isToolDone(toolState)} />
              {isToolDone(toolState) && toolName === "analytics_subagent" && openUiSpec && (
                <div className="prose-container">
                  <Renderer
                    response={openUiSpec}
                    library={openuiChatLibrary}
                    isStreaming={isOpenUiStreaming}
                    onAction={handleAction}
                  />
                </div>
              )}
            </div>
          );
        })}
        {textContent && (
          <div className="text-sm leading-6 whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
            {textContent}
          </div>
        )}
      </div>
    </div>
  );

}

