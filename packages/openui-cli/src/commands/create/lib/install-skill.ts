import { printLogTail, QUIET_COMMAND_CAPTURE_LIMIT } from "../../../lib/command-output";
import { CliCancelledError, processErrorProperties } from "../../../lib/errors";
import {
  runCommand,
  type CommandResult,
  type RunCommandOptions,
} from "../../../lib/process-runner";
import { withSpinner } from "../../../lib/spinner";
import type { CreateTelemetryClient } from "./telemetry";

const OPENUI_SKILL_SOURCE = "thesysdev/skills";

export async function shouldInstallSkill(
  option: boolean | undefined,
  interactive: boolean,
): Promise<boolean> {
  if (option !== undefined) return option;
  if (!interactive) return false;

  try {
    const { confirm } = await import("@inquirer/prompts");
    return await confirm({
      message: "Install the OpenUI agent skill for AI coding assistants?",
      default: true,
    });
  } catch (err) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (err instanceof ExitPromptError) {
      throw new CliCancelledError("skill_prompt");
    }
    throw err;
  }
}

async function runSkillInstall(
  targetDir: string,
  options: RunCommandOptions = {},
): Promise<CommandResult> {
  return runCommand(
    "npx",
    ["-y", "skills", "add", OPENUI_SKILL_SOURCE, "--skill", "openui", "-y"],
    targetDir,
    options,
  );
}

export async function installRequestedSkill(params: {
  enabled: boolean;
  verbose?: boolean;
  targetDir: string;
  tel: CreateTelemetryClient;
  printFailureLog?: boolean;
}): Promise<boolean> {
  const { enabled, verbose, targetDir, tel, printFailureLog } = params;
  if (!enabled) return false;

  tel.trackSkillInstallStarted({ skill_installed: true });
  const runSkill = () =>
    verbose
      ? runSkillInstall(targetDir)
      : runSkillInstall(targetDir, {
          echo: false,
          stdin: "ignore",
          captureLimit: QUIET_COMMAND_CAPTURE_LIMIT,
        });
  if (verbose) {
    console.info("Installing OpenUI agent skill...\n");
  }
  const skillResult = verbose
    ? await runSkill()
    : await withSpinner("Installing OpenUI agent skill...", runSkill);
  const skillInstalled = !skillResult.error && skillResult.status === 0;
  if (skillInstalled) {
    if (!verbose) {
      console.info("✓ OpenUI agent skill installed");
    }
    tel.trackSkillInstallFinished({
      skill_installed: true,
      duration_ms: skillResult.durationMs,
      exit_code: skillResult.status,
    });
    return true;
  }

  const properties = processErrorProperties(skillResult, "skill_install", {
    error_class: "dependency",
    error_code: "SKILL_INSTALL_FAILED",
  });
  if (properties.error_class === "user_cancelled") {
    tel.trackSkillInstallCancelled({
      skill_installed: false,
      ...properties,
    });
    throw new CliCancelledError(
      "skill_install",
      properties.cancellation_exit_code ?? 0,
      properties,
    );
  }
  tel.trackSkillInstallFailed({
    skill_installed: false,
    ...properties,
  });
  if (printFailureLog && !verbose) {
    printLogTail(skillResult.diagnosticTail, "skill install log (tail)");
  }
  console.warn(
    "\nCould not install the OpenUI agent skill automatically.\n" +
      "You can install it manually later with:\n\n" +
      "  npx skills add thesysdev/skills --skill openui\n",
  );
  return false;
}
