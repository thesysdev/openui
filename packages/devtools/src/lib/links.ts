/** Which product surface a referral came from: the OSS packages or OpenUI Cloud. */
export type DevtoolsSurface = "oss" | "cloud";

const UTM_PARAMS = {
  utm_source: "openui",
  utm_medium: "referral",
} as const;

const CAMPAIGNS: Record<DevtoolsSurface, string> = {
  oss: "openui_devtools_oss",
  cloud: "openui_devtools_cloud",
};

/**
 * `@openuidev/observability-cloud` registers its client under this well-known
 * symbol, so a devtools copy from any bundle can see it without depending on
 * that package. Keep in sync with its `GLOBAL_KEY`.
 */
const CLOUD_OBSERVABILITY_KEY = Symbol.for("openui.cloudObservability");

/** `"cloud"` once the cloud observability SDK is initialized in this app. */
export function detectDevtoolsSurface(): DevtoolsSurface {
  try {
    const state = (globalThis as Record<symbol, { client?: unknown } | undefined>)[
      CLOUD_OBSERVABILITY_KEY
    ];
    return state?.client ? "cloud" : "oss";
  } catch {
    return "oss";
  }
}

/**
 * Tags an outbound devtools link so referrals are attributable, keeping existing params.
 * `surface` splits the campaign between OSS and Cloud; it defaults to whichever
 * the running app looks like.
 */
export function withDevtoolsAttribution(
  href: string,
  content: string,
  surface: DevtoolsSurface = detectDevtoolsSurface(),
) {
  let url: URL;

  try {
    url = new URL(href);
  } catch {
    return href;
  }

  for (const [key, value] of Object.entries({
    ...UTM_PARAMS,
    utm_campaign: CAMPAIGNS[surface],
  })) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  }

  if (!url.searchParams.has("utm_content")) url.searchParams.set("utm_content", content);

  return url.toString();
}
