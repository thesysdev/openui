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

export function createFunnelProps(stepKey: CreateFunnelStep): Record<string, string> {
  return {
    ...createFunnel,
    step_rank: createFunnelSteps[stepKey],
    step_key: stepKey,
  };
}

export function aiSetupFromTemplate(template: TemplateName): AiSetup {
  return template === "openui-cloud" ? "openui_cloud" : "openai_compatible_provider";
}
