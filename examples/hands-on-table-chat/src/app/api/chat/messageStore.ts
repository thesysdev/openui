import OpenAI from "openai";

export type DBMessage = OpenAI.Chat.ChatCompletionMessageParam & {
  id?: string;
};

const messagesStore: Record<string, DBMessage[]> = {};

export const getMessageStore = (id: string) => {
  if (!messagesStore[id]) messagesStore[id] = [];
  const messageList = messagesStore[id];

  return {
    addMessage: (message: DBMessage) => {
      messageList.push(message);
    },
    messageList,
    getOpenAICompatibleMessageList: () =>
      messageList.map((m) => {
        const copy = { ...m };
        delete copy.id;
        return copy;
      }),
  };
};
