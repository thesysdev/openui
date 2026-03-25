export { MessageContext, MessageProvider, useMessage } from "./hooks/useMessage";
export { useThread, useThreadList } from "./hooks/useThread";

export { ChatProvider } from "./store/ChatProvider";
export {
  agUIAdapter,
  langGraphAdapter,
  openAIAdapter,
  openAIReadableStreamAdapter,
  openAIResponsesAdapter,
} from "./stream/adapters";
export {
  langGraphMessageFormat,
  openAIConversationMessageFormat,
  openAIMessageFormat,
} from "./stream/formats";
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
} from "./store/types";

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

export type { LangGraphAdapterOptions } from "./stream/adapters/langgraph";
export type { LangGraphMessageFormat } from "./stream/formats/langgraph-message-format";
export { identityMessageFormat } from "./types/messageFormat";
export type { MessageFormat } from "./types/messageFormat";
export { EventType } from "./types/stream";
export type { AGUIEvent, StreamProtocolAdapter } from "./types/stream";
