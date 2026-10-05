import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { MastraModelGateway, type GatewayLanguageModel, type ProviderConfig } from "@mastra/core/llm";

/** Full OpenUI Cloud model id, including the provider prefix Cloud expects. */
export const OPENUI_CLOUD_MODEL = "google/gemini-3.6-flash-free";

export const OPENUI_CLOUD_GATEWAY_ID = "openui-cloud";

/**
 * Registry provider id. Must not be `google` — Mastra's router treats that as
 * native Gemini and rewrites messages / strips the Cloud model prefix.
 */
const OPENUI_CLOUD_PROVIDER_ID = "thesys";

function isEmptyAssistant(message: Record<string, unknown>): boolean {
  if (message.role !== "assistant") return false;
  const hasToolCalls = Array.isArray(message.tool_calls) && message.tool_calls.length > 0;
  if (hasToolCalls) return false;
  const content = message.content;
  if (typeof content === "string") return content.length === 0;
  if (Array.isArray(content)) {
    return content.every((part) => {
      if (typeof part !== "object" || part === null) return true;
      const text = (part as { text?: unknown }).text;
      return typeof text !== "string" || text.length === 0;
    });
  }
  return content == null;
}

/**
 * Gemini 3.6 rejects Completions payloads that end on a model turn, including
 * empty assistant prefills the AI SDK sometimes appends.
 */
function sanitizeCompletionsBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(body.messages)) return body;
  const messages = (body.messages as Record<string, unknown>[]).filter((message) => !isEmptyAssistant(message));
  while (messages.length > 0 && messages[messages.length - 1]?.role === "assistant") {
    const last = messages[messages.length - 1];
    const hasToolCalls = Array.isArray(last.tool_calls) && last.tool_calls.length > 0;
    if (hasToolCalls) break;
    messages.pop();
  }
  return { ...body, messages };
}

/**
 * Mastra custom gateway for OpenUI Cloud Completions
 * (`POST /v1/embed/chat/completions`).
 * @see https://mastra.ai/models/gateways/custom-gateways
 */
export class OpenUICloudGateway extends MastraModelGateway {
  readonly id = OPENUI_CLOUD_GATEWAY_ID;
  readonly name = "OpenUI Cloud";

  async fetchProviders(): Promise<Record<string, ProviderConfig>> {
    return {
      [OPENUI_CLOUD_PROVIDER_ID]: {
        name: "OpenUI Cloud",
        models: [OPENUI_CLOUD_MODEL],
        apiKeyEnvVar: "THESYS_API_KEY",
        gateway: this.id,
        url: "https://api.thesys.dev/v1/embed",
      },
    };
  }

  buildUrl(): string {
    return "https://api.thesys.dev/v1/embed";
  }

  async getApiKey(): Promise<string> {
    const apiKey = process.env.THESYS_API_KEY;
    if (!apiKey) {
      throw new Error("Missing THESYS_API_KEY environment variable.");
    }
    return apiKey;
  }

  resolveLanguageModel({
    modelId,
    apiKey,
  }: {
    modelId: string;
    providerId: string;
    apiKey: string;
  }): GatewayLanguageModel {
    return createOpenAICompatible({
      name: OPENUI_CLOUD_GATEWAY_ID,
      apiKey,
      baseURL: "https://api.thesys.dev/v1/embed",
      supportsStructuredOutputs: true,
      transformRequestBody: sanitizeCompletionsBody,
    }).chatModel(modelId || OPENUI_CLOUD_MODEL);
  }
}

export const openuiCloudModelId =
  `${OPENUI_CLOUD_GATEWAY_ID}/${OPENUI_CLOUD_PROVIDER_ID}/${OPENUI_CLOUD_MODEL}` as const;
