import { createInterpreter } from "../tools/execute";
import type { Interpreter, InterpreterOptions } from "../tools/types";
import { createCloudApi, type CloudApi } from "./api";
import { Artifacts } from "./artifacts";
import type { OpenUIClientOptions } from "./types";

/**
 * One client for OpenUI Cloud on your server. Reads your API key from
 * `THESYS_API_KEY` unless you pass `apiKey`.
 */
export class OpenUIClient {
  /** Create and edit artifacts. */
  readonly artifacts: Artifacts;
  private readonly api: CloudApi;

  constructor(options: OpenUIClientOptions = {}) {
    this.api = createCloudApi(options);
    this.artifacts = new Artifacts(this.api);
  }

  /** Runs an artifact's data tools on your server.*/
  createInterpreter<Context = undefined>(
    options: InterpreterOptions<Context>,
  ): Interpreter<Context> {
    return createInterpreter(this.api, options);
  }
}
