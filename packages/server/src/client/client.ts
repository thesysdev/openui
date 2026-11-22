import type { ExecutionContext } from "../tools/types";
import { createCloudApi, type CloudApi } from "./api";
import { createArtifacts } from "./artifacts";
import { defineDashboard } from "./dashboard";
import { createFrontendToken } from "./frontend-token";
import {
  OpenUIApiError,
  type Artifacts,
  type CreateFrontendTokenParams,
  type Dashboard,
  type DashboardOptions,
  type FrontendToken,
  type OpenUIClientOptions,
  type RequestOptions,
} from "./types";

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
    if (
      options.appId !== undefined &&
      (typeof options.appId !== "string" || !options.appId.trim())
    ) {
      throw new OpenUIApiError("appId must be a non-empty string", "invalid_input");
    }
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
    return createFrontendToken(this.api, params.userId, params.groupIds, options?.signal);
  }
}
