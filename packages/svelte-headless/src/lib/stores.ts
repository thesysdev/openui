import type {
  ChatStore,
  Message,
  ThreadActions,
  ThreadListActions,
  ThreadListState,
  ThreadState,
} from "./internal";
import { get, readable, type Readable } from "svelte/store";
import type { StoreApi } from "zustand";
import { getChatStore, getMessageStore } from "./context";

type ThreadSlice = ThreadState & ThreadActions;
type ThreadListSlice = ThreadListState & ThreadListActions;

const threadSelector = (state: ChatStore): ThreadSlice => ({
  messages: state.messages,
  isRunning: state.isRunning,
  isLoadingMessages: state.isLoadingMessages,
  threadError: state.threadError,
  processMessage: state.processMessage,
  appendMessages: state.appendMessages,
  updateMessage: state.updateMessage,
  setMessages: state.setMessages,
  deleteMessage: state.deleteMessage,
  cancelMessage: state.cancelMessage,
});

const threadListSelector = (state: ChatStore): ThreadListSlice => ({
  threads: state.threads,
  isLoadingThreads: state.isLoadingThreads,
  threadListError: state.threadListError,
  selectedThreadId: state.selectedThreadId,
  hasMoreThreads: state.hasMoreThreads,
  loadThreads: state.loadThreads,
  loadMoreThreads: state.loadMoreThreads,
  switchToNewThread: state.switchToNewThread,
  createThread: state.createThread,
  selectThread: state.selectThread,
  updateThread: state.updateThread,
  deleteThread: state.deleteThread,
});

export function selectChatStore<T>(
  store: StoreApi<ChatStore>,
  selector: (state: ChatStore) => T,
  equals: (currentValue: T, nextValue: T) => boolean = Object.is,
): Readable<T> {
  return readable(selector(store.getState()), (set) => {
    let currentValue = selector(store.getState());

    return store.subscribe((nextState: ChatStore) => {
      const nextValue = selector(nextState);
      if (equals(currentValue, nextValue)) return;
      currentValue = nextValue;
      set(nextValue);
    });
  });
}

export function createThreadStore(store: StoreApi<ChatStore>): Readable<ThreadSlice> {
  return selectChatStore(store, threadSelector, shallowEqual);
}

export function createThreadListStore(store: StoreApi<ChatStore>): Readable<ThreadListSlice> {
  return selectChatStore(store, threadListSelector, shallowEqual);
}

export function getThreadStore(): Readable<ThreadSlice> {
  return createThreadStore(getChatStore());
}

export function getThreadListStore(): Readable<ThreadListSlice> {
  return createThreadListStore(getChatStore());
}

export function getMessageSnapshot(): Message {
  return get(getMessageStore());
}

function shallowEqual<T>(currentValue: T, nextValue: T): boolean {
  if (Object.is(currentValue, nextValue)) return true;

  if (
    !currentValue ||
    !nextValue ||
    typeof currentValue !== "object" ||
    typeof nextValue !== "object"
  ) {
    return false;
  }

  const currentEntries = Object.entries(currentValue);
  const nextEntries = Object.entries(nextValue);

  if (currentEntries.length !== nextEntries.length) return false;

  return currentEntries.every(([key, value]) => Object.is(value, (nextValue as Record<string, unknown>)[key]));
}
