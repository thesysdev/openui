type PostHog = (typeof import("posthog-js"))["default"];

let posthogPromise: Promise<PostHog> | undefined;

export function loadPostHog(): Promise<PostHog> {
  posthogPromise ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init("phc_3OLW53x09ZTVZSV6BEpj5uycj3ooqR6KOemOjx04e3D", {
      api_host: "https://dgoeivjus9jfp.cloudfront.net",
      capture_pageview: "history_change",
      disable_session_recording: false,
      session_recording: {
        sampleRate: 0.3,
      },
      disable_surveys: true,
    });

    return posthog;
  });

  return posthogPromise;
}

export const analytics = {
  capture(eventName: string, properties: object = {}): void {
    void loadPostHog()
      .then((posthog) => posthog.capture(eventName, properties as Record<string, unknown>))
      .catch(() => {
        // Analytics must never interfere with the user action being measured.
      });
  },
};

export const CREATE_CLI_COMMAND_COPIED_EVENT = "create_cli_command_copied";

export type CreateCliPackageManager = "pnpm" | "bun" | "yarn" | "npm" | "unknown";

export interface CreateCliCopyAnalyticsContext {
  source: string;
  interaction?: string;
}

interface CreateCliCommandCopiedProperties {
  package_manager: CreateCliPackageManager;
  source: string;
  interaction?: string;
}

const CREATE_CLI_COMMAND_PATTERN = /@openuidev\/cli(?:@\S+)?\s+create(?:\s|$)/i;

export function getCreateCliPackageManager(command: string): CreateCliPackageManager | null {
  const normalized = command.trim().replace(/\s+/g, " ");
  if (!CREATE_CLI_COMMAND_PATTERN.test(normalized)) return null;

  if (/^pnpx\s/i.test(normalized)) return "pnpm";
  if (/^bunx\s/i.test(normalized)) return "bun";
  if (/^yarn dlx\s/i.test(normalized)) return "yarn";
  if (/^npx\s/i.test(normalized)) return "npm";
  return "unknown";
}

export function getCreateCliCommandCopiedProperties(
  command: string,
  context: CreateCliCopyAnalyticsContext,
): CreateCliCommandCopiedProperties | null {
  const packageManager = getCreateCliPackageManager(command);
  if (!packageManager) return null;

  return {
    package_manager: packageManager,
    source: context.source,
    ...(context.interaction ? { interaction: context.interaction } : {}),
  };
}

export function captureCreateCliCommandCopied(
  command: string,
  context: CreateCliCopyAnalyticsContext,
): void {
  const properties = getCreateCliCommandCopiedProperties(command, context);
  if (!properties || typeof window === "undefined") return;

  analytics.capture(CREATE_CLI_COMMAND_COPIED_EVENT, properties);
}
