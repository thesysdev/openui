import { describe, expect, it } from "vitest";
import { runInstallTelemetry } from "../install";
import { calculateProjectHash } from "../runtime";

const ORIGIN = "git@github.com:Acme/app.git";

async function installProjectId(home: string): Promise<string | undefined> {
  const result = await runInstallTelemetry({
    env: { INIT_CWD: "/work/app" },
    io: {
      homedir: () => home,
      readFile: () => {
        throw new Error("missing");
      },
      writeFile: () => {},
      mkdir: () => {},
      getGitOrigin: () => ORIGIN,
      stderr: () => {},
    },
    send: async () => {},
  });
  return result.status === "sent" ? result.payload.properties.project_id : undefined;
}

describe("project ID", () => {
  it("is the same for a repository across telemetry states", async () => {
    const first = await installProjectId("/home/a");
    const second = await installProjectId("/home/b");

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(second).toBe(first);
  });

  it("matches between installation and runtime telemetry", async () => {
    expect(await calculateProjectHash(ORIGIN)).toBe(await installProjectId("/home/a"));
  });

  it("treats equivalent origins as the same repository", async () => {
    expect(await calculateProjectHash("https://github.com/Acme/app")).toBe(
      await calculateProjectHash(ORIGIN),
    );
  });
});
