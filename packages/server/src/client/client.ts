import { ToolExecutionError, type Interpreter, type InterpreterRequest } from "../tools/types";
import { createCloudApi, type CloudApi } from "./api";
import { defineDashboard } from "./dashboard";
import { createFrontendToken } from "./frontend-token";
import {
  OpenUIApiError,
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
  private readonly dashboards = new Map<string, Dashboard<any>>();

  constructor(options: OpenUIClientOptions = {}) {
    this.api = createCloudApi(options);
  }

  /** Defines a live dashboard from your library and data tools. Each needs its own `name`. */
  defineDashboard<Context = undefined>(options: DashboardOptions<Context>): Dashboard<Context> {
    if (this.dashboards.has(options?.name)) {
      throw new OpenUIApiError(
        `A dashboard named "${options.name}" is already defined`,
        "invalid_input",
      );
    }
    const dashboard = defineDashboard(this.api, options);
    this.dashboards.set(dashboard.name, dashboard);
    return dashboard;
  }

  /**
   * Runs any of your dashboards' data tools: each request goes to the dashboard
   * that made its artifact (`request.definition`, which the renderer sends).
   * `context` reaches that dashboard's tools as is.
   */
  readonly interpreter: Interpreter<unknown> = {
    execute: async (request: InterpreterRequest, options?) => {
      const name = request?.definition;
      const dashboard =
        name === undefined && this.dashboards.size === 1
          ? [...this.dashboards.values()][0]
          : name === undefined
            ? undefined
            : this.dashboards.get(name);
      if (!dashboard) {
        throw name === undefined
          ? new ToolExecutionError(
              "Which dashboard? The request needs a definition",
              "invalid_input",
              400,
            )
          : new ToolExecutionError(`No dashboard named "${name}"`, "unknown_definition", 404);
      }
      return dashboard.interpreter.execute(request, options);
    },
  };

  /** Mints the signed-in user's frontend token. Return it from your token endpoint as is. */
  createFrontendToken(
    params: CreateFrontendTokenParams,
    options?: RequestOptions,
  ): Promise<FrontendToken> {
    return createFrontendToken(this.api, params.userId, options?.signal);
  }
}
