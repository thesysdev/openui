import {
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
} from "@openuidev/react-ui";

// Gateway restores earlier turns from the conversation id, so send only the latest message.
export const chatLLM: ChatLLM = {
  streamProtocol: openAIResponsesAdapter(),
  send: ({ threadId, messages, signal }) =>
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId,
        input: openAIConversationMessageFormat.toApi(messages.slice(-1)),
      }),
      signal,
    }),
};
