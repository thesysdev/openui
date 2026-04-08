import { useThread, useThreadList } from "@openuidev/react-headless";
import { useCallback } from "react";

/**
 * Hook for sharing conversation threads by threadId.
 * The consumer's backend looks up messages by threadId.
 *
 * @category Hooks
 */
export const useShareThread = ({
  generateShareLink,
}: {
  generateShareLink: (threadId: string) => Promise<string>;
}) => {
  const { isRunning, isLoadingMessages, messages } = useThread();
  const { selectedThreadId } = useThreadList();

  const getShareThreadLink = useCallback(async () => {
    if (!selectedThreadId) throw new Error("No thread selected");
    return generateShareLink(selectedThreadId);
  }, [generateShareLink, selectedThreadId]);

  return {
    shouldDisableShareButton: isRunning || isLoadingMessages || !selectedThreadId,
    hasMessages: messages.length > 0,
    getShareThreadLink,
  };
};
