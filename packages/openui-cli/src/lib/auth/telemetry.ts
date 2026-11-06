import { Telemetry } from "../telemetry";

export class AuthTelemetryClient extends Telemetry {
  /** `funnelProps`: the calling command's funnel step for the browser sign-in, if it has one. */
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
