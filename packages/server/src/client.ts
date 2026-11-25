import { createArtifacts } from "./artifacts";
import { defineDashboard } from "./artifacts/dashboards";
import type { Dashboard, DashboardOptions } from "./artifacts/dashboards/types";
import type { Artifacts } from "./artifacts/types";
import type { CreateAutofixParams } from "./autofix/types";
import { createCloudApi, type CloudApi, type OpenUIClientOptions } from "./core/http";
import type { RequestOptions } from "./core/resource";
import {
  createFrontendToken,
  type CreateFrontendTokenParams,
  type FrontendToken,
} from "./frontend-token";
import type { ExecutionContext } from "./interpreter/types";
import { chatAutofix, type ChatAutofix } from "./openai/autofix";
import { vercelAutofix, type VercelAutofix } from "./vercel/autofix";

/** One client for OpenUI Cloud on your server. Reads `THESYS_API_KEY` unless you pass `apiKey`. */
export class OpenUIClient {
  private readonly api: CloudApi;

  /** Your saved artifacts. Without `userId`, calls cover your whole org; with it, that user. */
  readonly artifacts: Artifacts;

  /**
   * Chat Completions: `createAutofix({ library })`, which returns `{ completions }`. Types come
   * from `openai`.
   */
  readonly chat: { createAutofix(params: CreateAutofixParams): ChatAutofix };

  /** Autofix for the Vercel AI SDK: `createAutofix({ library })` returns `{ ai }`. */
  readonly vercel: { createAutofix(params: CreateAutofixParams): VercelAutofix };

  constructor(options: OpenUIClientOptions = {}) {
    this.api = createCloudApi(options);
    this.artifacts = createArtifacts(this.api);
    this.chat = { createAutofix: (params) => chatAutofix(this.api, params) };
    this.vercel = { createAutofix: (params) => vercelAutofix(this.api, params) };
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
