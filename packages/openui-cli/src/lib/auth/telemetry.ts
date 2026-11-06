import { Telemetry } from "../telemetry";

export class AuthTelemetryClient extends Telemetry {
  trackOidcStarted() {
    this.capture("cli_cloud_oidc_started", {
      funnel: "cli_create",
      // Keep in sync with the create funnel in commands/create/lib/telemetry.ts.
      funnel_version: "deferred_cloud_setup_v1",
      step_rank: "0660",
      step_key: "cloud_auth_started",
      auth_method: "oauth",
    });
  }
}
