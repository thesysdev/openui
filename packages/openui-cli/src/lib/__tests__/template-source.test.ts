import { describe, expect, it } from "vitest";

import { templateSourceError } from "../scaffold/source";

describe("templateSourceError", () => {
  it("classifies errno errors as filesystem failures", () => {
    const error = Object.assign(new Error("permission denied"), { code: "EACCES" });
    const result = templateSourceError(error, "openui-cloud");

    expect(result).toMatchObject({
      stage: "preflight",
      errorClass: "filesystem",
      errorCode: "PERMISSION_DENIED",
    });
  });

  it("classifies plain errors as network template failures", () => {
    const result = templateSourceError(new Error("connection reset"), "openui-cloud");

    expect(result).toMatchObject({
      stage: "preflight",
      errorClass: "network",
      errorCode: "TEMPLATE_MISSING",
    });
    expect(result.message).toContain("network");
  });
});
