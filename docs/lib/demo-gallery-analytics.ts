"use client";

import { analytics, captureCreateCliCommandCopied } from "./analytics";

export const BUILD_CTA_ENABLED =
  process.env.NEXT_PUBLIC_DEMO_BUILD_CTA_ENABLED === "1" ||
  (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEMO_BUILD_CTA_ENABLED !== "0");

export function captureGalleryEvent(event: string, demoId: string, destination: string) {
  if (typeof window === "undefined") return;
  const properties = {
    demo_id: demoId,
    surface: "gallery",
    destination,
    measurement_version: "demo-activation-v1",
    experience_variant: BUILD_CTA_ENABLED ? "build_cta" : "baseline",
  };
  if (process.env.NODE_ENV !== "production") {
    window.dispatchEvent(
      new CustomEvent("openui:analytics-debug", { detail: { event, properties } }),
    );
    return;
  }
  if (!["www.openui.com", "openui.com"].includes(window.location.hostname)) return;
  analytics.capture(event, { ...properties, analytics_environment: "production" });
}

export function captureTemplateCopy(command: string, demoId: string) {
  captureGalleryEvent("demo:template_copied", demoId, "local_template");
  if (
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "production" &&
    ["www.openui.com", "openui.com"].includes(window.location.hostname)
  ) {
    captureCreateCliCommandCopied(command, {
      source: "demo_gallery",
      interaction: "template_copy",
    });
  }
}
