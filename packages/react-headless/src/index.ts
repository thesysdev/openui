export { ChatProvider } from "./v2/ChatProvider";
export { useThread, useThreadList } from "./v2/hooks";

export { MessageContext, MessageProvider, useMessage } from "./hooks/useMessage";
export {
  agUIAdapter,
  openAIAdapter,
  openAIConversationMessageFormat,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
  openAIResponsesAdapter,
  vercelAIAdapter,
  vercelAIMessageFormat,
} from "./stream/adapters";
export { processStreamedMessage } from "./stream/processStreamedMessage";

export type {
  ChatProviderProps,
  ChatStore,
  CreateMessage,
  Thread,
  ThreadActions,
  ThreadListActions,
  ThreadListState,
  ThreadState,
} from "./v2/types";

export type {
  ActivityMessage,
  AssistantMessage,
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
} from "./types/message";

export { identityMessageFormat } from "./types/messageFormat";
export type { MessageFormat } from "./types/messageFormat";
export { EventType } from "./types/stream";
export type { AGUIEvent, StreamProtocolAdapter } from "./types/stream";
