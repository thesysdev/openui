import { afterEach, describe, expect, it } from "vitest";
import { detectDevtoolsSurface, withDevtoolsAttribution } from "./links";

const CLOUD_KEY = Symbol.for("openui.cloudObservability");
const root = globalThis as Record<symbol, unknown>;

afterEach(() => {
  delete root[CLOUD_KEY];
});

describe("withDevtoolsAttribution", () => {
  it("tags OSS apps with the oss campaign", () => {
    const url = new URL(withDevtoolsAttribution("https://www.openui.com/docs", "banner"));
    expect(url.searchParams.get("utm_campaign")).toBe("openui_devtools_oss");
    expect(url.searchParams.get("utm_source")).toBe("openui");
    expect(url.searchParams.get("utm_content")).toBe("banner");
  });

  it("tags apps running the cloud observability SDK with the cloud campaign", () => {
    root[CLOUD_KEY] = { client: {}, options: {} };
    expect(detectDevtoolsSurface()).toBe("cloud");
    const url = new URL(withDevtoolsAttribution("https://www.openui.com/docs", "banner"));
    expect(url.searchParams.get("utm_campaign")).toBe("openui_devtools_cloud");
  });

  it("treats an uninitialized cloud SDK as oss", () => {
    root[CLOUD_KEY] = { client: null, options: null };
    expect(detectDevtoolsSurface()).toBe("oss");
  });

  it("honours an explicit surface", () => {
    const url = new URL(
      withDevtoolsAttribution("https://console.thesys.dev/billing", "quota", "cloud"),
    );
    expect(url.searchParams.get("utm_campaign")).toBe("openui_devtools_cloud");
  });

  it("keeps existing params and returns non-URLs untouched", () => {
    const url = new URL(
      withDevtoolsAttribution("https://www.openui.com/docs?utm_campaign=manual", "banner"),
    );
    expect(url.searchParams.get("utm_campaign")).toBe("manual");
    expect(withDevtoolsAttribution("/docs", "banner")).toBe("/docs");
  });
});
