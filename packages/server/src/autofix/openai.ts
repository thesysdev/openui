import type { ChatCompletionChunk } from "openai/resources/chat/completions";

/** Create a correction or stop chunk with the original completion's routing fields. */
export function correctionChunk(
  template: ChatCompletionChunk,
  index: number,
  content: string | null,
): ChatCompletionChunk {
  return {
    id: template.id,
    object: template.object,
    created: template.created,
    model: template.model,
    ...(template.system_fingerprint !== undefined && {
      system_fingerprint: template.system_fingerprint,
    }),
    ...(template.service_tier !== undefined && { service_tier: template.service_tier }),
    choices: [
      {
        index,
        delta: content === null ? {} : { content },
        finish_reason: content === null ? "stop" : null,
      },
    ],
  };
}
