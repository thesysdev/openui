import { Message } from "@openuidev/react-headless";

export const isChatEmpty = ({
  isLoadingMessages,
  messages,
}: {
  isLoadingMessages: boolean | undefined;
  messages: Message[];
}) => {
  return !isLoadingMessages && messages.length === 0;
};
