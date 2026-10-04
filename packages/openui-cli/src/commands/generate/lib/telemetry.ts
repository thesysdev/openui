import { Telemetry } from "../../../lib/telemetry";

export class GenerateTelemetryClient extends Telemetry {
  trackStarted(props: { json_schema: boolean; spec: boolean; out_to_file: boolean }) {
    this.capture("cli_generate_started", props);
  }

  trackSucceeded(props: {
    json_schema: boolean;
    spec: boolean;
    out_to_file: boolean;
    duration_ms: number;
  }) {
    this.capture("cli_generate_succeeded", props);
  }
}
