import { AuthTelemetryClient } from "../../../lib/auth/telemetry";
import { cliErrorProperties } from "../../../lib/errors";
import type { RetryAttemptInfo } from "../../../lib/retry";
import { Telemetry } from "../../../lib/telemetry";
import type { AiSetup, TemplateName } from "./create-types";

const createFunnel = {
  funnel: "cli_create",
  funnel_version: "frontloaded_cloud_setup_v1",
} as const;

const createFunnelSteps = {
  create_started: "0100",
  ai_setup_selected: "0200",
  backend_framework_selected: "0250",
  example_selected: "0260",
  scaffold_started: "0300",
  scaffold_succeeded: "0310",
  scaffold_failed: "0320",
  env_resolution_started: "0400",
  cloud_auth_started: "0410",
  cloud_auth_resolved: "0420",
  cloud_auth_failed: "0425",
  cloud_auth_cancelled: "0426",
  env_written: "0430",
  skill_prompt_resolved: "0500",
  skill_install_started: "0510",
  skill_install_finished: "0520",
  skill_install_failed: "0525",
  skill_install_cancelled: "0526",
  dependency_install_started: "0600",
  dependency_install_succeeded: "0610",
  dependency_install_failed: "0620",
  dependency_install_cancelled: "0625",
  create_succeeded: "0700",
  create_failed: "9000",
  create_cancelled: "9010",
} as const;

type CreateFunnelStep = keyof typeof createFunnelSteps;

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
    return new AuthTelemetryClient(this);
  }

  registerContext(props: Record<string, unknown>) {
    this.register(props);
  }

  trackStarted(props: {
    interactive: boolean;
    has_name_arg: boolean;
    has_template_arg: boolean;
    has_backend_framework_arg: boolean;
    has_example_arg: boolean;
    has_api_key_arg: boolean;
    has_auth_arg: boolean;
    no_install: boolean;
    immediate_arg: boolean | undefined;
  }) {
    this.capture("cli_create_started", { ...createFunnelProps("create_started"), ...props });
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

  trackEnvResolutionStarted(props: { template?: string; ai_setup?: string; example?: string }) {
    this.capture("cli_env_resolution_started", {
      ...createFunnelProps("env_resolution_started"),
      ...props,
    });
  }

  trackSkillInstalled(props: { skill_installed: boolean }) {
    this.capture("cli_skill_installed", {
      ...createFunnelProps("skill_prompt_resolved"),
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

  trackScaffoldStarted(props: { template?: string; ai_setup?: string; example?: string }) {
    this.capture("cli_scaffold_started", { ...createFunnelProps("scaffold_started"), ...props });
  }

  trackScaffoldFailed(props: Record<string, unknown>) {
    this.capture("cli_scaffold_failed", { ...createFunnelProps("scaffold_failed"), ...props });
  }

  trackScaffoldSucceeded(props: { template?: string; ai_setup?: string; example?: string }) {
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

  trackCloudAuthStarted(props: { auth_method?: string }) {
    this.capture("cli_cloud_auth_started", {
      ...createFunnelProps("cloud_auth_started"),
      ...props,
    });
  }

  trackCloudAuthMethod(props: { auth_method: string; auth_succeeded: boolean }) {
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

  trackDependencyInstallStarted(props: { template: string; ai_setup: string }) {
    this.capture("cli_dependency_install_started", {
      ...createFunnelProps("dependency_install_started"),
      ...props,
    });
  }

  trackDependencyInstallSucceeded(props: {
    template: string;
    ai_setup: string;
    dependency_installed: boolean;
  }) {
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

  trackNetworkRetry(props: {
    failure_stage: string;
    attempt: number;
    max_attempts: number;
    delay_ms: number;
    error_class: string;
    error_code: string;
  }) {
    this.capture("cli_network_retry", props);
  }

  trackSkillInstallStarted(props: { skill_installed: boolean }) {
    this.capture("cli_skill_install_started", {
      ...createFunnelProps("skill_install_started"),
      ...props,
    });
  }

  trackSkillInstallFinished(props: {
    skill_installed: boolean;
    duration_ms: number;
    exit_code: number | null;
  }) {
    this.capture("cli_skill_install_finished", {
      ...createFunnelProps("skill_install_finished"),
      ...props,
    });
  }

  trackSkillInstallCancelled(props: Record<string, unknown>) {
    this.capture("cli_skill_install_cancelled", {
      ...createFunnelProps("skill_install_cancelled"),
      ...props,
    });
  }

  trackSkillInstallFailed(props: Record<string, unknown>) {
    this.capture("cli_skill_install_failed", {
      ...createFunnelProps("skill_install_failed"),
      ...props,
    });
  }

  trackTargetNameRetried(props: { retries: number }) {
    this.capture("cli_target_name_retried", props);
  }

  trackTargetExists(props: {
    interactive: boolean;
    attempt: number;
    exhausted: boolean;
    error_code: string;
  }) {
    this.capture("cli_target_exists", props);
  }
}

export function retryReporter(
  tel: CreateTelemetryClient,
  stage: string,
): (info: RetryAttemptInfo) => void {
  return (info) => {
    const properties = cliErrorProperties(info.error);
    tel.trackNetworkRetry({
      failure_stage: stage,
      attempt: info.attempt,
      max_attempts: info.maxAttempts,
      delay_ms: info.delayMs,
      error_class: properties.error_class,
      error_code: properties.error_code,
    });
  };
}
