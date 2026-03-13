export {
  agUIAdapter,
  openAIAdapter,
  openAIReadableStreamAdapter,
  openAIResponsesAdapter,
} from "./stream/adapters";
export { openAIConversationMessageFormat, openAIMessageFormat } from "./stream/formats";
export { processStreamedMessage } from "./stream/processStreamedMessage";

export { createChatStore } from "./store/createChatStore";
export type {
  ChatStore,
  ChatStoreConfig,
  CreateChatStoreOptions,
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

export { identityMessageFormat } from "./types/messageFormat";
export type { MessageFormat } from "./types/messageFormat";
export { EventType } from "./types/stream";
export type { AGUIEvent, StreamProtocolAdapter } from "./types/stream";
