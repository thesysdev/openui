import { Telemetry } from "../telemetry";

export class AuthTelemetryClient extends Telemetry {
  // No funnel step: cli_cloud_auth_started already marks this step in the create
  // funnel, and generate-api-key (which shares this client) isn't in that funnel.
  trackOidcStarted() {
    this.capture("cli_cloud_oidc_started", { auth_method: "oauth" });
  }
}
