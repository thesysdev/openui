import { describe, expect, it } from "vitest";
import { artifactTool, createDashboardTools } from "../cloud";

const CLOUD_SUPPORTED_ARTIFACT_TYPES = ["slides", "report", "dashboard"];

describe("artifactTool — defaults", () => {
  const ALL_WITH_VERSION = {
    type: "artifact",
    artifacts: [
      { artifact_type: "slides", library_version: "0.1.0" },
      { artifact_type: "report", library_version: "0.1.0" },
      { artifact_type: "dashboard", library_version: "0.1.0" },
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
      artifacts: [{ artifact_type: "slides", library_version: "0.1.0" }],
    });
  });

  it("'report' shorthand → entry with pinned version", () => {
    expect(artifactTool({ artifacts: ["report"] })).toEqual({
      type: "artifact",
      artifacts: [{ artifact_type: "report", library_version: "0.1.0" }],
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

describe("artifactTool — dashboard generation tools", () => {
  const dashboardTools = createDashboardTools({
    tools: [
      {
        type: "function",
        name: "get_kpis",
        description: "KPIs by year",
        parameters: { type: "object", properties: { year: { type: "string" } } },
        sample: { revenue: 0 },
        execute: () => ({ revenue: 0 }),
      },
    ],
  });

  it("renders dashboard tool docs into the entry instruction", () => {
    const entry = artifactTool({
      artifacts: [{ type: "dashboard", tools: dashboardTools }],
    });
    const dashboard = entry.artifacts?.[0];

    expect(dashboard).toMatchObject({
      artifact_type: "dashboard",
      library_version: "0.1.0",
    });
    expect(dashboard?.instruction).toContain("### get_kpis");
    expect(dashboard?.instruction).toContain("KPIs by year");
    expect(dashboard?.instruction).toContain('"year"');
    expect(dashboard?.instruction).toContain('sample_output: {"revenue":0}');
    expect(dashboard?.instruction).toContain("structured `tools` argument");
  });

  it("accepts a dashboard tools result and appends its docs after custom instructions", () => {
    const entry = artifactTool({
      artifacts: [
        {
          type: "dashboard",
          instruction: "Prefer dark charts.",
          tools: dashboardTools,
        },
      ],
    });

    const instruction = entry.artifacts?.[0]?.instruction ?? "";
    expect(instruction.startsWith("Prefer dark charts.")).toBe(true);
    expect(instruction).toContain("### get_kpis");
  });

  it("normalizes a no-argument tool to an empty object schema", () => {
    const entry = artifactTool({
      artifacts: [
        {
          type: "dashboard",
          tools: createDashboardTools({
            tools: [
              {
                type: "function",
                name: "get_status",
                sample: { up: true },
                execute: () => ({ up: true }),
              },
            ],
          }),
        },
      ],
    });

    expect(entry.artifacts?.[0]?.instruction).toContain(
      'parameters: {"type":"object","properties":{}}',
    );
  });

  it("preserves rich JSON Schema in dashboard guidance", () => {
    const entry = artifactTool({
      artifacts: [
        {
          type: "dashboard",
          tools: createDashboardTools({
            tools: [
              {
                type: "function",
                name: "search_orders",
                parameters: {
                  type: "object",
                  properties: {
                    region: { type: "string", enum: ["na", "emea"] },
                    ids: { type: "array", items: { type: "integer" } },
                    window: {
                      type: "object",
                      properties: { from: { type: "string" } },
                    },
                  },
                  required: ["region"],
                },
                execute: () => [],
              },
            ],
          }),
        },
      ],
    });

    const instruction = entry.artifacts?.[0]?.instruction ?? "";
    expect(instruction).toContain('"enum":["na","emea"]');
    expect(instruction).toContain('"items":{"type":"integer"}');
    expect(instruction).toContain('"from":{"type":"string"}');
  });

  it("rejects dashboard tool definitions on other artifact types", () => {
    expect(() =>
      artifactTool({ artifacts: [{ type: "slides", tools: dashboardTools } as never] }),
    ).toThrow(/only valid on the 'dashboard' entry/);
  });
});
