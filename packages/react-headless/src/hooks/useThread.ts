import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useChatStore } from "../store/ChatContext";
import type {
  ChatStore,
  ThreadActions,
  ThreadListActions,
  ThreadListState,
  ThreadState,
} from "../store/types";

type ThreadSlice = ThreadState & ThreadActions;
type ThreadListSlice = ThreadListState & ThreadListActions;

// The active thread lives directly in the store's flat fields.
const threadSelector = (s: ChatStore): ThreadSlice => ({
  messages: s.messages,
  isRunning: s.isRunning,
  isLoadingMessages: s.isLoadingMessages,
  threadError: s.threadError,
  executingToolCallIds: s.executingToolCallIds,
  processMessage: s.processMessage,
  appendMessages: s.appendMessages,
  updateMessage: s.updateMessage,
  setMessages: s.setMessages,
  deleteMessage: s.deleteMessage,
  cancelMessage: s.cancelMessage,
});

const threadListSelector = (s: ChatStore): ThreadListSlice => ({
  threads: s.threads,
  isLoadingThreads: s.isLoadingThreads,
  threadListError: s.threadListError,
  selectedThreadId: s.selectedThreadId,
  hasMoreThreads: s.hasMoreThreads,
  isCreatingThread: s.isCreatingThread,
  loadThreads: s.loadThreads,
  loadMoreThreads: s.loadMoreThreads,
  switchToNewThread: s.switchToNewThread,
  createThread: s.createThread,
  selectThread: s.selectThread,
  updateThread: s.updateThread,
  deleteThread: s.deleteThread,
});

export function useThread(): ThreadSlice;
export function useThread<T>(selector: (state: ThreadSlice) => T): T;
export function useThread<T>(selector?: (state: ThreadSlice) => T) {
  const store = useChatStore();
  if (selector) {
    return useStore(store, (s) => selector(threadSelector(s)));
  }
  return useStore(store, useShallow(threadSelector));
}

export function useThreadList(): ThreadListSlice;
export function useThreadList<T>(selector: (state: ThreadListSlice) => T): T;
export function useThreadList<T>(selector?: (state: ThreadListSlice) => T) {
  const store = useChatStore();
  if (selector) {
    return useStore(store, (s) => selector(threadListSelector(s)));
  }
  return useStore(store, useShallow(threadListSelector));
}
