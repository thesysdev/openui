import { spawn } from "node:child_process";

import { CreateError } from "./errors";

export function gitInstallHint(platform: NodeJS.Platform = process.platform): string {
  if (platform === "win32") {
    return "Install it with `winget install --id Git.Git -e --source winget` or `choco install git`, or download it from https://git-scm.com/download/win. Then open a new terminal and rerun this command.";
  }
  if (platform === "darwin") {
    return "Install it with `brew install git` or `xcode-select --install`, then rerun this command.";
  }
  return "Install it with your package manager, e.g. `sudo apt install git` (Debian/Ubuntu) or `sudo dnf install git` (Fedora), then rerun this command.";
}

export function gitMissingMessage(platform?: NodeJS.Platform): string {
  return `git is required to download the template but was not found in PATH.\n${gitInstallHint(platform)}`;
}

export async function ensureGitAvailable(
  options: { command?: string; platform?: NodeJS.Platform } = {},
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (result: () => void) => {
      if (settled) return;
      settled = true;
      result();
    };
    const child = spawn(options.command ?? "git", ["--version"], {
      stdio: "ignore",
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
    child.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        finish(() =>
          reject(
            new CreateError(
              "preflight",
              gitMissingMessage(options.platform),
              "process",
              "GIT_MISSING",
            ),
          ),
        );
        return;
      }
      finish(resolve);
    });
    child.once("close", () => finish(resolve));
  });
}
