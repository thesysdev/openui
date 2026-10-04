import { Telemetry } from "../telemetry";

export class AuthTelemetryClient extends Telemetry {
  trackOidcStarted() {
    this.capture("cli_cloud_oidc_started", {
      funnel: "cli_create",
      funnel_version: "frontloaded_cloud_setup_v1",
      step_rank: "0410",
      step_key: "cloud_auth_started",
      auth_method: "oauth",
    });
  }
}
