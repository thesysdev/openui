import { describe, expect, it } from "vitest";
import { artifactTool, REPORT_LIBRARY_VERSION, SLIDES_LIBRARY_VERSION } from "../cloud";

const CLOUD_SUPPORTED_ARTIFACT_TYPES = ["slides", "report"];

describe("artifactTool — defaults", () => {
  const ALL_WITH_VERSION = {
    type: "artifact",
    artifacts: [
      { artifact_type: "slides", library_version: SLIDES_LIBRARY_VERSION },
      { artifact_type: "report", library_version: REPORT_LIBRARY_VERSION },
    ],
  };

  it("no options → all types WITH library_version", () => {
    expect(artifactTool()).toEqual(ALL_WITH_VERSION);
  });

  it("empty options → all types WITH library_version too", () => {
    expect(artifactTool({})).toEqual(ALL_WITH_VERSION);
  });
});

describe("artifactTool — restriction", () => {
  it("'slides' shorthand → entry with pinned version", () => {
    expect(artifactTool({ artifacts: ["slides"] })).toEqual({
      type: "artifact",
      artifacts: [{ artifact_type: "slides", library_version: SLIDES_LIBRARY_VERSION }],
    });
  });

  it("'report' shorthand → entry with pinned version", () => {
    expect(artifactTool({ artifacts: ["report"] })).toEqual({
      type: "artifact",
      artifacts: [{ artifact_type: "report", library_version: REPORT_LIBRARY_VERSION }],
    });
  });

  it("mixed shorthand + object entries, order preserved", () => {
    const entry = artifactTool({
      artifacts: [{ type: "slides", instruction: "Use the corporate template." }, "report"],
    });
    expect(entry.artifacts?.map((a) => a.artifact_type)).toEqual(["slides", "report"]);
    expect(entry.artifacts?.[0]?.instruction).toBe("Use the corporate template.");
    expect(entry.artifacts?.[1]).not.toHaveProperty("instruction");
  });

  it("every emitted artifact_type is Cloud-supported", () => {
    const entry = artifactTool({ artifacts: ["slides", "report"] });
    for (const a of entry.artifacts ?? []) {
      expect(CLOUD_SUPPORTED_ARTIFACT_TYPES).toContain(a.artifact_type);
    }
  });

  it("libraryVersion override wins over the pinned constant", () => {
    const entry = artifactTool({
      artifacts: [{ type: "report", libraryVersion: "2.3.0" }],
    });
    expect(entry.artifacts?.[0]?.library_version).toBe("2.3.0");
  });
});

describe("artifactTool — validation", () => {
  it("empty artifacts array throws (omit to enable all)", () => {
    expect(() => artifactTool({ artifacts: [] })).toThrow(/must not be empty/);
  });

  it("duplicate artifact kinds throw", () => {
    expect(() => artifactTool({ artifacts: ["report", { type: "report" }] })).toThrow(/duplicate/);
  });

  it("unknown artifact kind throws — incl. 'presentation' (not wire vocabulary)", () => {
    expect(() => artifactTool({ artifacts: ["presentation" as never] })).toThrow(
      /unknown artifact type 'presentation'/,
    );
  });
});
