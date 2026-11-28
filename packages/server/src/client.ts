import { createArtifacts } from "./artifacts";
import { defineDashboard } from "./artifacts/dashboards";
import type { Dashboard, DashboardOptions } from "./artifacts/dashboards/types";
import type { Artifacts } from "./artifacts/types";
import type { CreateAutofixParams } from "./autofix/types";
import { createConversations, withAdapter } from "./conversations";
import type {
  ChatConversations,
  Conversations,
  LangGraphConversations,
} from "./conversations/types";
import { createCloudApi, type CloudApi, type OpenUIClientOptions } from "./core/http";
import type { RequestOptions } from "./core/resource";
import {
  createFrontendToken,
  type CreateFrontendTokenParams,
  type FrontendToken,
} from "./frontend-token";
import type { ExecutionContext } from "./interpreter/types";
import { langGraphAdapter } from "./langgraph/messages";
import { chatAutofix, type ChatAutofix } from "./openai/autofix";
import { chatCompletionsAdapter } from "./openai/messages";
import { aiAutofix, type AIAutofix } from "./vercel/autofix";

/** One client for OpenUI Cloud on your server. Reads `THESYS_API_KEY` unless you pass `apiKey`. */
export class OpenUIClient {
  private readonly api: CloudApi;

  /** Your saved artifacts. Without `userId`, calls cover your whole org; with it, that user. */
  readonly artifacts: Artifacts;

  /** Your users' conversations. Without `userId`, calls cover your org; with it, that user. */
  readonly conversations: Conversations;

  /**
   * Chat Completions: `conversations` with items as its messages, and `createAutofix({ library })`,
   * which returns `{ fix, stream }`. Types come from `openai`.
   */
  readonly chat: {
    readonly conversations: ChatConversations;
    createAutofix(params: CreateAutofixParams): ChatAutofix;
  };

  /**
   * `conversations`, with items as LangChain messages; `items.list` returns what `graph.invoke`
   * takes. Types come from `@langchain/core`.
   */
  readonly langgraph: { readonly conversations: LangGraphConversations };

  /** The Vercel AI SDK: `createAutofix({ library })` returns `{ fix, stream }`. Types come from `ai`. */
  readonly ai: { createAutofix(params: CreateAutofixParams): AIAutofix };

  constructor(options: OpenUIClientOptions = {}) {
    this.api = createCloudApi(options);
    this.artifacts = createArtifacts(this.api);
    this.conversations = createConversations(this.api);
    this.chat = {
      conversations: withAdapter(this.conversations, chatCompletionsAdapter),
      createAutofix: (params) => chatAutofix(this.api, params),
    };
    this.langgraph = {
      conversations: withAdapter(this.conversations, langGraphAdapter),
    };
    this.ai = { createAutofix: (params) => aiAutofix(this.api, params) };
  }

  /** Defines live dashboards from your library and data tools; its `interpreter` runs them. */
  defineDashboard<Context extends ExecutionContext = ExecutionContext>(
    options: DashboardOptions<Context>,
  ): Dashboard<Context> {
    return defineDashboard(this.api, options);
  }

  /** Mints the signed-in user's frontend token. Return it from your token endpoint as is. */
  createFrontendToken(
    params: CreateFrontendTokenParams,
    options?: RequestOptions,
  ): Promise<FrontendToken> {
    return createFrontendToken(this.api, params, options?.signal);
  }
}
