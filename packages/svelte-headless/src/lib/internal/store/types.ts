import type { Message, UserMessage } from "../types/message";
import type { MessageFormat } from "../types/messageFormat";
import type { StreamProtocolAdapter } from "../types/stream";

export type { Message, UserMessage } from "../types/message";
export type CreateMessage = Omit<UserMessage, "id">;

export type Thread = {
  id: string;
  title: string;
  createdAt: string | number;
  isPending?: boolean;
};

// ── Thread List slice ──

export type ThreadListState = {
  threads: Thread[];
  isLoadingThreads: boolean;
  threadListError: Error | null;
  selectedThreadId: string | null;
  hasMoreThreads: boolean;
};

export type ThreadListActions = {
  loadThreads: () => void;
  loadMoreThreads: () => void;
  switchToNewThread: () => void;
  createThread: (firstMessage: UserMessage) => Promise<Thread>;
  selectThread: (threadId: string) => void;
  updateThread: (thread: Thread) => void;
  deleteThread: (threadId: string) => void;
};

// ── Thread slice ──

export type ThreadState = {
  messages: Message[];
  isRunning: boolean;
  isLoadingMessages: boolean;
  threadError: Error | null;
};

export type ThreadActions = {
  processMessage: (message: CreateMessage) => Promise<void>;
  appendMessages: (...messages: Message[]) => void;
  updateMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  deleteMessage: (messageId: string) => void;
  cancelMessage: () => void;
};

// ── Combined store ──

export type ChatStore = ThreadListState &
  ThreadListActions &
  ThreadState &
  ThreadActions & {
    /** @internal */
    _nextCursor?: any;
    /** @internal */
    _abortController: AbortController | null;
  };

// ── Provider props ──

type ThreadApiConfig =
  | {
      threadApiUrl: string;
      fetchThreadList?: never;
      createThread?: never;
      deleteThread?: never;
      updateThread?: never;
      loadThread?: never;
    }
  | {
      threadApiUrl?: never;
      fetchThreadList?: (cursor?: any) => Promise<{ threads: Thread[]; nextCursor?: any }>;
      createThread?: (firstMessage: UserMessage) => Promise<Thread>;
      deleteThread?: (id: string) => Promise<void>;
      updateThread?: (updated: Thread) => Promise<Thread>;
      loadThread?: (threadId: string) => Promise<Message[]>;
    };

type ChatApiConfig =
  | {
      apiUrl: string;
      processMessage?: never;
    }
  | {
      apiUrl?: never;
      processMessage: (params: {
        threadId: string;
        messages: Message[];
        abortController: AbortController;
      }) => Promise<Response>;
    };

export type ChatStoreConfig = ThreadApiConfig &
  ChatApiConfig & {
    streamProtocol?: StreamProtocolAdapter;
    messageFormat?: MessageFormat;
  };

export type CreateChatStoreOptions = ChatStoreConfig;
