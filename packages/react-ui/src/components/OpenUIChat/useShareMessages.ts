import type { Message } from "@openuidev/react-headless";
import { useCallback, useState } from "react";

interface UseShareMessagesOptions {
  initialMessages?: Message[];
  shareMode?: boolean;
}

/**
 * Hook for managing a list of messages that can be selected for sharing.
 *
 * @category Hooks
 */
export const useShareMessages = ({
  initialMessages = [],
  shareMode = false,
}: UseShareMessagesOptions = {}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(
    new Set(initialMessages.map((message) => message.id)),
  );

  const addMessage = useCallback(
    (message: Message) => {
      if (!shareMode) return;

      setSelectedMessageIds((prevIds) => {
        if (prevIds.has(message.id)) return prevIds;
        const newIds = new Set(prevIds);
        newIds.add(message.id);
        return newIds;
      });

      setMessages((prevMessages) => {
        if (prevMessages.some((m) => m.id === message.id)) return prevMessages;
        return [...prevMessages, message];
      });
    },
    [shareMode],
  );

  const removeMessage = useCallback(
    (messageToRemove: Message) => {
      if (!shareMode) return;

      setSelectedMessageIds((prevIds) => {
        if (!prevIds.has(messageToRemove.id)) return prevIds;
        const newIds = new Set(prevIds);
        newIds.delete(messageToRemove.id);
        return newIds;
      });

      setMessages((prevMessages) =>
        prevMessages.filter((message) => message.id !== messageToRemove.id),
      );
    },
    [shareMode],
  );

  const toggleMessageSelection = useCallback(
    (message: Message) => {
      if (!shareMode) return;

      setSelectedMessageIds((prevIds) => {
        if (prevIds.has(message.id)) {
          setMessages((prevMessages) => prevMessages.filter((m) => m.id !== message.id));
          const newIds = new Set(prevIds);
          newIds.delete(message.id);
          return newIds;
        } else {
          setMessages((prevMessages) => {
            if (prevMessages.some((m) => m.id === message.id)) return prevMessages;
            return [...prevMessages, message];
          });
          const newIds = new Set(prevIds);
          newIds.add(message.id);
          return newIds;
        }
      });
    },
    [shareMode],
  );

  const updateSelectedMessages = useCallback(
    (messagesToUpdate: Message[], mode: "append" | "replace" = "replace") => {
      if (!shareMode) return;

      if (mode === "append") {
        setMessages((prevMessages) => {
          const existingIds = new Set(prevMessages.map((m) => m.id));
          const newMessages = messagesToUpdate.filter((message) => !existingIds.has(message.id));
          return [...prevMessages, ...newMessages];
        });

        setSelectedMessageIds((prevIds) => {
          const newIds = new Set(prevIds);
          messagesToUpdate.forEach((message) => newIds.add(message.id));
          return newIds;
        });
      } else {
        const filteredMessages = messagesToUpdate.filter(
          (message, index, self) => index === self.findIndex((m) => m.id === message.id),
        );

        setMessages(filteredMessages);
        setSelectedMessageIds(new Set(filteredMessages.map((message) => message.id)));
      }
    },
    [shareMode],
  );

  const isMessageSelected = useCallback(
    (message: Message) => {
      return selectedMessageIds.has(message.id);
    },
    [selectedMessageIds],
  );

  return {
    addMessage,
    isMessageSelected,
    removeMessage,
    selectedMessages: messages,
    shareMode,
    toggleMessageSelection,
    updateSelectedMessages,
  };
};
