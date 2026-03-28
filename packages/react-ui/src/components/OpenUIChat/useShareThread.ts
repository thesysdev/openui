import type { Message } from "@openuidev/react-headless";
import { useThread } from "@openuidev/react-headless";
import { useCallback, useEffect } from "react";
import { useShareMessages } from "./useShareMessages";

/**
 * Hook for sharing entire conversation threads.
 * Auto-selects all messages and provides a function to generate a shareable link.
 *
 * @category Hooks
 */
export const useShareThread = ({
  generateShareLink,
}: {
  generateShareLink: (messages: Message[]) => Promise<string>;
}) => {
  const { isLoadingMessages, messages, isRunning } = useThread();

  const { selectedMessages, updateSelectedMessages } = useShareMessages({
    shareMode: true,
  });

  useEffect(() => {
    if (!isLoadingMessages && messages.length > 0) {
      updateSelectedMessages(messages, "replace");
    }
  }, [isLoadingMessages, messages, updateSelectedMessages]);

  const getShareThreadLink = useCallback(async () => {
    return generateShareLink(selectedMessages);
  }, [generateShareLink, selectedMessages]);

  return {
    shouldDisableShareButton: isRunning || isLoadingMessages,
    selectedMessages,
    getShareThreadLink,
  };
};
