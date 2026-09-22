import { describe, expect, it } from "vitest";

import { CreateError } from "../errors";
import { ensureGitAvailable, gitInstallHint } from "../git-preflight";

describe("git preflight", () => {
  it("reports a Windows install hint when git is missing", async () => {
    await expect(
      ensureGitAvailable({
        command: "definitely-not-a-real-binary-openui",
        platform: "win32",
      }),
    ).rejects.toMatchObject({
      stage: "preflight",
      errorCode: "GIT_MISSING",
      errorClass: "process",
    } satisfies Partial<CreateError>);
    await expect(
      ensureGitAvailable({
        command: "definitely-not-a-real-binary-openui",
        platform: "win32",
      }),
    ).rejects.toThrow(/winget/);
  });

  it("resolves when the command exits successfully", async () => {
    await expect(ensureGitAvailable({ command: process.execPath })).resolves.toBeUndefined();
  });

  it.each([
    ["win32", "winget"],
    ["darwin", "brew"],
    ["linux", "apt"],
  ] as const)("includes the %s installation hint", (platform, hint) => {
    expect(gitInstallHint(platform)).toContain(hint);
  });
});
