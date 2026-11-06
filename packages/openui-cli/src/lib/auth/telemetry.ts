import { Telemetry } from "../telemetry";

export class AuthTelemetryClient extends Telemetry {
  /**
   * `funnelProps`: the calling command's funnel labels for the browser sign-in.
   * `create` passes its own; `generate-api-key` isn't in a funnel and passes none.
   */
  constructor(
    source: Telemetry,
    private readonly funnelProps: Record<string, string> = {},
  ) {
    super(source);
  }

  trackOidcStarted() {
    this.capture("cli_cloud_oidc_started", { ...this.funnelProps, auth_method: "oauth" });
  }
}
