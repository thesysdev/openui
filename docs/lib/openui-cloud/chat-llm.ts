import { isDemoCreditsErrorPayload } from "@/lib/demo-credits";
import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import type { ChatLLM } from "@openuidev/react-headless";
import {
  fetchLLM,
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
} from "@openuidev/react-ui";

interface CloudChatLLM extends ChatLLM {
  setSelectedModel: (model: string) => void;
}

interface CloudChatLLMOptions {
  initialModel?: string;
  shouldSendFullHistory?: (threadId: string) => boolean;
  onFullHistoryAccepted?: (threadId: string) => void;
  onPromptSubmitted?: (observation: CloudChatObservation) => void;
  /** Called when the chat route answers with the demo-credits 402. Read once, so pass a stable function. */
  onCreditsExhausted?: () => void;
}

export interface CloudChatObservation {
  threadId: string;
  model: string;
}

export function createCloudChatLLM(options: CloudChatLLMOptions = {}): CloudChatLLM {
  let selectedModel = options.initialModel ?? DEFAULT_MODEL;
  const llm = fetchLLM({
    url: "/api/openui-cloud/chat",
    streamAdapter: openAIResponsesAdapter(),
    messageFormat: openAIConversationMessageFormat,
    fetch: async (input, init) => {
      const payload = JSON.parse(String(init?.body)) as {
        threadId: string;
        messages: unknown[];
      };
      const shouldSendFullHistory = options.shouldSendFullHistory?.(payload.threadId) ?? false;
      const observation = { threadId: payload.threadId, model: selectedModel };
      options.onPromptSubmitted?.(observation);

      let response: Response;
      try {
        response = await fetch(input, {
          ...init,
          body: JSON.stringify({
            threadId: payload.threadId,
            input: shouldSendFullHistory ? payload.messages : payload.messages.slice(-1),
            model: selectedModel,
          }),
        });
      } catch (error) {
        throw error;
      }

      if (!response.ok) {
        const errorPayload = await response
          .clone()
          .json()
          .catch(() => ({}));
        if (
          options.onCreditsExhausted &&
          isDemoCreditsErrorPayload((errorPayload as { error?: unknown }).error)
        ) {
          options.onCreditsExhausted();
          // End the turn quietly; the dialog explains what happened.
          return new Response("data: [DONE]\n\n", {
            headers: { "Content-Type": "text/event-stream" },
          });
        }
        return response;
      }

      if (shouldSendFullHistory) {
        options.onFullHistoryAccepted?.(payload.threadId);
      }

      return response;
    },
  });

  return {
    ...llm,
    setSelectedModel(model) {
      selectedModel = model;
    },
  };
}
