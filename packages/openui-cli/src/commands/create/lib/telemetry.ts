import { AuthTelemetryClient } from "../../../lib/auth/telemetry";
import { Telemetry } from "../../../lib/telemetry";
import type { AiSetup, TemplateName } from "./create-types";

const createFunnel = {
  funnel: "cli_create",
  // Sign-in moved from before scaffolding to after install (was
  // `frontloaded_cloud_setup_v1`), so the steps below are ranked in that order.
  funnel_version: "deferred_cloud_setup_v1",
} as const;

const createFunnelSteps = {
  create_started: "0100",
  catalog_loaded: "0120",
  project_name_selected: "0150",
  ai_setup_selected: "0200",
  backend_framework_selected: "0250",
  example_selected: "0260",
  scaffold_started: "0300",
  scaffold_succeeded: "0310",
  scaffold_failed: "0320",
  dependency_install_started: "0600",
  dependency_install_succeeded: "0610",
  dependency_install_failed: "0620",
  dependency_install_cancelled: "0625",
  env_resolution_started: "0650",
  cloud_auth_started: "0660",
  cloud_oidc_started: "0665",
  cloud_auth_resolved: "0670",
  cloud_auth_failed: "0675",
  cloud_auth_cancelled: "0676",
  env_written: "0680",
  create_succeeded: "0700",
  create_failed: "9000",
  create_cancelled: "9010",
} as const;

type CreateFunnelStep = keyof typeof createFunnelSteps;

/** What is being scaffolded: a template (with its AI setup) or an example. */
export type ScaffoldTelemetryProps = { template?: string; ai_setup?: string; example?: string };

function createFunnelProps(stepKey: CreateFunnelStep): Record<string, string> {
  return {
    ...createFunnel,
    step_rank: createFunnelSteps[stepKey],
    step_key: stepKey,
  };
}

export function aiSetupFromTemplate(template: TemplateName): AiSetup {
  return template === "openui-cloud" ? "openui_cloud" : "openai_compatible_provider";
}

export class CreateTelemetryClient extends Telemetry {
  static failedProperties(cancelled: boolean): Record<string, string> {
    return createFunnelProps(cancelled ? "create_cancelled" : "create_failed");
  }

  authClient(): AuthTelemetryClient {
    return new AuthTelemetryClient(this, createFunnelProps("cloud_oidc_started"));
  }

  registerContext(props: Record<string, unknown>) {
    this.register(props);
  }

  trackStarted(props: {
    has_name_arg: boolean;
    has_backend_framework_arg: boolean;
    has_example_arg: boolean;
    no_install: boolean;
    immediate_arg: boolean | undefined;
  }) {
    this.capture("cli_create_started", { ...createFunnelProps("create_started"), ...props });
  }

  /** Template + example catalogs downloaded; `duration_ms` is the wait before the first prompt. */
  trackCatalogLoaded(props: { duration_ms: number }) {
    this.capture("cli_catalog_loaded", { ...createFunnelProps("catalog_loaded"), ...props });
  }

  trackProjectNameSelected(props: { name_source: "arg" | "prompt" | "default" | "current_dir" }) {
    this.capture("cli_project_name_selected", {
      ...createFunnelProps("project_name_selected"),
      ...props,
    });
  }

  trackAiSetupSelected(props: { template: string; ai_setup: string }) {
    this.capture("cli_ai_setup_selected", { ...createFunnelProps("ai_setup_selected"), ...props });
  }

  trackBackendFrameworkSelected(props: {
    backend_framework: string;
    backend_framework_source: string;
  }) {
    this.capture("cli_backend_framework_selected", {
      ...createFunnelProps("backend_framework_selected"),
      ...props,
    });
  }

  trackExampleSelected(props: { example: string; example_source: string }) {
    this.capture("cli_example_selected", { ...createFunnelProps("example_selected"), ...props });
  }

  trackEnvResolutionStarted(props: ScaffoldTelemetryProps) {
    this.capture("cli_env_resolution_started", {
      ...createFunnelProps("env_resolution_started"),
      ...props,
    });
  }

  trackImmediateSelected(props: {
    immediate: boolean;
    dependency_install_requested: boolean;
    selection_source: string;
  }) {
    this.capture("cli_immediate_selected", props);
  }

  trackScaffoldStarted(props: ScaffoldTelemetryProps) {
    this.capture("cli_scaffold_started", { ...createFunnelProps("scaffold_started"), ...props });
  }

  trackScaffoldFailed(props: Record<string, unknown>) {
    this.capture("cli_scaffold_failed", { ...createFunnelProps("scaffold_failed"), ...props });
  }

  trackScaffoldSucceeded(props: ScaffoldTelemetryProps) {
    this.capture("cli_scaffold_succeeded", {
      ...createFunnelProps("scaffold_succeeded"),
      ...props,
    });
  }

  trackEnvResolved(props: Record<string, unknown>) {
    this.capture("cli_env_resolved", { ...createFunnelProps("env_written"), ...props });
  }

  trackCreateSucceeded(props: Record<string, unknown>) {
    this.capture("cli_create_succeeded", { ...createFunnelProps("create_succeeded"), ...props });
  }

  trackDevCommandSkipped(props: { skip_reason: string; required_env?: string }) {
    this.capture("cli_dev_command_skipped", props);
  }

  trackDevCommandStarted(props: { package_manager: string }) {
    this.capture("cli_dev_command_started", props);
  }

  /** The dev server answered and the CLI tried to open it in the browser. */
  trackDevServerReady(props: { time_to_ready_ms: number; browser_opened: boolean }) {
    this.capture("cli_dev_server_ready", props);
  }

  trackDevCommandStopped(props: {
    package_manager: string;
    duration_ms: number;
    exit_code: number | null;
    failure_signal: NodeJS.Signals | null;
  }) {
    this.capture("cli_dev_command_stopped", props);
  }

  trackDevCommandFailed(props: Record<string, unknown>) {
    this.capture("cli_dev_command_failed", props);
  }

  trackCloudAuthStarted() {
    this.capture("cli_cloud_auth_started", createFunnelProps("cloud_auth_started"));
  }

  trackCloudAuthMethod(props: {
    auth_method: string;
    auth_succeeded: boolean;
    /** Why sign-in was skipped: `non_interactive`, `key_in_env` or `cancelled` (Ctrl+C). */
    skip_reason?: string;
  }) {
    this.capture("cli_cloud_auth_method", {
      ...createFunnelProps("cloud_auth_resolved"),
      ...props,
    });
  }

  trackCloudAuthCancelled(props: Record<string, unknown>) {
    this.capture("cli_cloud_auth_cancelled", {
      ...createFunnelProps("cloud_auth_cancelled"),
      ...props,
    });
  }

  trackCloudAuthFailed(props: Record<string, unknown>) {
    this.capture("cli_cloud_auth_failed", { ...createFunnelProps("cloud_auth_failed"), ...props });
  }

  trackDependencyInstallSkipped(props: { skip_reason: string }) {
    this.capture("cli_dependency_install_skipped", props);
  }

  trackDependencyInstallStarted(props: ScaffoldTelemetryProps) {
    this.capture("cli_dependency_install_started", {
      ...createFunnelProps("dependency_install_started"),
      ...props,
    });
  }

  trackDependencyInstallSucceeded(
    props: ScaffoldTelemetryProps & { dependency_installed: boolean },
  ) {
    this.capture("cli_dependency_install_succeeded", {
      ...createFunnelProps("dependency_install_succeeded"),
      ...props,
    });
  }

  trackDependencyInstallCancelled(props: Record<string, unknown>) {
    this.capture("cli_dependency_install_cancelled", {
      ...createFunnelProps("dependency_install_cancelled"),
      ...props,
    });
  }

  trackDependencyInstallFailed(props: Record<string, unknown>) {
    this.capture("cli_dependency_install_failed", {
      ...createFunnelProps("dependency_install_failed"),
      ...props,
    });
  }

  trackTargetNameRetried(props: { retries: number }) {
    this.capture("cli_target_name_retried", props);
  }

  trackTargetExists(props: { attempt: number; exhausted: boolean; error_code: string }) {
    this.capture("cli_target_exists", props);
  }
}
