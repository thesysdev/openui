import { createArtifacts } from "./artifacts";
import { defineDashboard } from "./artifacts/dashboards";
import type { Dashboard, DashboardOptions } from "./artifacts/dashboards/types";
import type { Artifacts } from "./artifacts/types";
import { createCloudApi, type CloudApi, type OpenUIClientOptions } from "./core/http";
import type { RequestOptions } from "./core/resource";
import {
  createFrontendToken,
  type CreateFrontendTokenParams,
  type FrontendToken,
} from "./frontend-token";
import type { ExecutionContext } from "./interpreter/types";

/**
 * One client for OpenUI Cloud on your server. Reads your API key from
 * `THESYS_API_KEY` unless you pass `apiKey`.
 */
export class OpenUIClient {
  private readonly api: CloudApi;

  /**
   * Your saved artifacts. Without `userId`, calls cover every user in your org;
   * with it, they act as that user.
   */
  readonly artifacts: Artifacts;

  constructor(options: OpenUIClientOptions = {}) {
    this.api = createCloudApi(options);
    this.artifacts = createArtifacts(this.api);
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
