import { createCloudApi } from "./api";
import { Artifacts } from "./artifacts";
import type { OpenUIClientOptions } from "./types";

/**
 * One client for OpenUI Cloud on your server. Reads your API key from
 * `THESYS_API_KEY` unless you pass `apiKey`.
 *
 * ```ts
 * const openui = new OpenUIClient();
 * const { toolResponse } = await openui.artifacts.createLive({ … });
 * ```
 */
export class OpenUIClient {
  /** Create and edit artifacts. */
  readonly artifacts: Artifacts;

  constructor(options: OpenUIClientOptions = {}) {
    this.artifacts = new Artifacts(createCloudApi(options));
  }
}
