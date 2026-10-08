import type { AssistantMessage as AGUIAssistantMessage } from "@ag-ui/core";

export type {
  ActivityMessage,
  BinaryInputContent,
  DeveloperMessage,
  FunctionCall,
  InputContent,
  Message,
  ReasoningMessage,
  SystemMessage,
  TextInputContent,
  ToolCall,
  ToolMessage,
  UserMessage,
} from "@ag-ui/core";

export type AssistantMessage = AGUIAssistantMessage & {
  /** LLM run that produced this message. Set by `processStreamedMessage`. */
  runId?: string;
  /** Inspect run title derived from the user prompt. Set by `processStreamedMessage`. */
  runTitle?: string;
};
