import { describe, expect, it } from "vitest";
import { humanizeToolName, toolLabel } from "../toolLabels";

describe("toolLabel", () => {
  it("uses on-brand copy for built-in tool families", () => {
    expect(toolLabel("executing", "web_search")).toBe("Searching the web");
    expect(toolLabel("complete", "web_search")).toBe("Searched the web");
    expect(toolLabel("streaming", "thesys_image_search")).toBe("Finding images");
    expect(toolLabel("complete", "get_weather")).toBe("Checked the weather");
    expect(toolLabel("error", "generate_report")).toBe("Couldn't build the artifact");
  });

  it("turns unknown tool names into words", () => {
    expect(toolLabel("executing", "lookup_order_status")).toBe("Using lookup order status");
    expect(toolLabel("complete", "openui-sendEmail")).toBe("Used send email");
    expect(toolLabel("error", "lookup_order_status")).toBe("Lookup order status failed");
    expect(toolLabel("complete", "  ")).toBe("Used a tool");
  });

  it("lets overrides replace any stage, matched case-insensitively", () => {
    const labels = { Get_Weather: { done: "Checked the forecast" } };
    expect(toolLabel("complete", "get_weather", labels)).toBe("Checked the forecast");
    expect(toolLabel("executing", "get_weather", labels)).toBe("Checking the weather");
  });
});

describe("humanizeToolName", () => {
  it("drops vendor prefixes and separators", () => {
    expect(humanizeToolName("thesys_image_search")).toBe("image search");
    expect(humanizeToolName("getWeather")).toBe("get weather");
  });
});
