import { PostHog } from "posthog-node";

// Public ingestion key
const POSTHOG_KEY =
  process.env["OPENUI_POSTHOG_KEY"] ?? "phc_3OLW53x09ZTVZSV6BEpj5uycj3ooqR6KOemOjx04e3D";
const POSTHOG_HOST = process.env["OPENUI_POSTHOG_HOST"] ?? "https://us.i.posthog.com";

export function createPostHogClient(options: { disableGeoip?: boolean } = {}): PostHog {
  return new PostHog(POSTHOG_KEY, {
    host: POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
    ...options,
  });
}
