import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useChatStore } from "../store/ChatContext";

/**
 * Per-thread UI state for a thread **by id** (e.g. a sidebar row). Returns a state
 * object rather than a bare value so it can grow more fields without a breaking
 * change; for now it exposes only {@link ThreadStateView.isStreaming}.
 */
export interface ThreadStateView {
  /** Whether the thread is streaming in the **background** */
  isStreaming: boolean;
}

/**
 * @category Hooks
 */
export function useThreadState(threadId: string | null): ThreadStateView {
  const store = useChatStore();
  return useStore(
    store,
    useShallow((s) => ({
      isStreaming: threadId != null && threadId in s.inFlightThreads,
    })),
  );
}
