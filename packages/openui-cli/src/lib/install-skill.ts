import { execSync } from "child_process";

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
      process.exit(0);
    }
    throw err;
  }
}

export function runSkillInstall(targetDir: string): void {
  console.info("\nInstalling OpenUI agent skill...\n");
  try {
    execSync("npx -y skills add thesysdev/openui --skill openui -y", {
      stdio: "inherit",
      cwd: targetDir,
    });
  } catch {
    console.warn(
      "\nCould not install the OpenUI agent skill automatically.\n" +
        "You can install it manually later with:\n\n" +
        "  npx skills add thesysdev/openui --skill openui\n",
    );
  }
}
