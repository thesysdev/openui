import { Telemetry } from "../../../lib/telemetry";

export class DeployTelemetryClient extends Telemetry {
  registerContext(props: Record<string, unknown>) {
    this.register(props);
  }

  trackStarted(props: {
    target: string;
    prod: boolean;
    yes: boolean;
    skip_env: boolean;
    verbose: boolean;
    interactive: boolean;
    is_openui_project: boolean;
    has_dir_arg: boolean;
  }) {
    this.capture("cli_deploy_started", props);
  }

  trackNonOpenUiProject() {
    this.capture("cli_deploy_non_openui_project");
  }

  trackSucceeded(props: Record<string, unknown>) {
    this.capture("cli_deploy_succeeded", props);
  }
}
