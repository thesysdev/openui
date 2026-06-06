import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveDlxInvocation, resolveInstallPackageManager } from "../detect-package-manager";

describe("resolveInstallPackageManager", () => {
  const originalUserAgent = process.env["npm_config_user_agent"];

  beforeEach(() => {
    delete process.env["npm_config_user_agent"];
  });

  afterEach(() => {
    if (originalUserAgent === undefined) {
      delete process.env["npm_config_user_agent"];
    } else {
      process.env["npm_config_user_agent"] = originalUserAgent;
    }
  });

  it("resolves pnpm for a pnpm user agent", () => {
    process.env["npm_config_user_agent"] = "pnpm/9.1.0 npm/? node/v20.0.0 linux x64";
    expect(resolveInstallPackageManager()).toMatchObject({
      name: "pnpm",
      installCmd: "pnpm install",
      runCmd: "pnpm",
      dlxCmd: "pnpm dlx",
    });
  });

  it("resolves yarn with 'yarn dlx' for a yarn berry user agent", () => {
    process.env["npm_config_user_agent"] = "yarn/4.1.0 npm/? node/v20.0.0 linux x64";
    expect(resolveInstallPackageManager()).toMatchObject({
      name: "yarn",
      installCmd: "yarn",
      installArgs: [],
      dlxCmd: "yarn dlx",
    });
  });

  it("falls back to npx for yarn classic, which has no dlx", () => {
    process.env["npm_config_user_agent"] = "yarn/1.22.22 npm/? node/v20.0.0 linux x64";
    expect(resolveInstallPackageManager()).toMatchObject({ name: "yarn", dlxCmd: "npx" });
  });

  it("resolves bun for a bun user agent", () => {
    process.env["npm_config_user_agent"] = "bun/1.1.0 npm/? node/v20.0.0 linux x64";
    expect(resolveInstallPackageManager()).toMatchObject({
      name: "bun",
      installCmd: "bun install",
      dlxCmd: "bunx",
    });
  });

  it("resolves npm for an npm user agent", () => {
    process.env["npm_config_user_agent"] = "npm/10.5.0 node/v20.0.0 linux x64";
    expect(resolveInstallPackageManager()).toMatchObject({ name: "npm", dlxCmd: "npx" });
  });

  it("resolves npm when the user agent is unset", () => {
    expect(resolveInstallPackageManager().name).toBe("npm");
  });

  it("resolves npm for an unrecognized user agent", () => {
    process.env["npm_config_user_agent"] = "deno/1.40.0";
    expect(resolveInstallPackageManager().name).toBe("npm");
  });

  it("does not match package managers that merely contain the name", () => {
    process.env["npm_config_user_agent"] = "custom-pnpm/1.0.0";
    expect(resolveInstallPackageManager().name).toBe("npm");
  });
});

describe("resolveDlxInvocation", () => {
  it("runs the package through npx, with a quiet variant", () => {
    expect(resolveDlxInvocation("vercel@latest")).toEqual({
      command: "npx",
      args: ["--yes", "vercel@latest"],
      quietArgs: ["--yes", "--quiet", "vercel@latest"],
    });
  });
});
