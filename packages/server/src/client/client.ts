import type { ExecutionContext } from "../tools/types";
import { createCloudApi, type CloudApi } from "./api";
import { defineDashboard } from "./dashboard";
import { createFrontendToken } from "./frontend-token";
import type {
  CreateFrontendTokenParams,
  Dashboard,
  DashboardOptions,
  FrontendToken,
  OpenUIClientOptions,
  RequestOptions,
} from "./types";

/**
 * One client for OpenUI Cloud on your server. Reads your API key from
 * `THESYS_API_KEY` unless you pass `apiKey`.
 */
export class OpenUIClient {
  private readonly api: CloudApi;

  constructor(options: OpenUIClientOptions = {}) {
    this.api = createCloudApi(options);
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
    return createFrontendToken(this.api, params.userId, options?.signal);
  }
}
