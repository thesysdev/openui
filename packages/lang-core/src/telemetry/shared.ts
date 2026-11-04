// Browser-safe primitives shared by runtime and installation telemetry.
export const POSTHOG_KEY = "phc_3OLW53x09ZTVZSV6BEpj5uycj3ooqR6KOemOjx04e3D";
export const POSTHOG_HOST = "https://dgoeivjus9jfp.cloudfront.net";
export const TELEMETRY_REQUEST_TIMEOUT_MS = 2_000;
export const TELEMETRY_SCHEMA_VERSION = 2;
// Fixed salt so installation and runtime telemetry derive project IDs the same standard way.
export const PROJECT_ID_SALT = "openui-project-id";

export type TelemetryEnvironment = Readonly<Record<string, string | undefined>>;

export function getPostHogConfig(env?: TelemetryEnvironment): {
  apiKey: string;
  captureUrl: string;
} {
  const host = env?.["OPENUI_POSTHOG_HOST"] ?? POSTHOG_HOST;
  return {
    apiKey: env?.["OPENUI_POSTHOG_KEY"] ?? POSTHOG_KEY,
    captureUrl: new URL("/capture/", host).toString(),
  };
}

export function isTruthyEnv(value?: string): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

export function isTelemetryDisabled(env?: TelemetryEnvironment): boolean {
  return isTruthyEnv(env?.["OPENUI_TELEMETRY_DISABLED"]) || isTruthyEnv(env?.["DO_NOT_TRACK"]);
}

/** Runtime telemetry is opt-in: it requires explicit consent and honors the disable flags. */
export function isRuntimeTelemetryEnabled(env?: TelemetryEnvironment): boolean {
  return isTruthyEnv(env?.["OPENUI_RUNTIME_TELEMETRY_ENABLED"]) && !isTelemetryDisabled(env);
}

export function normalizeProjectIdentity(rawValue: string): string {
  const value = rawValue.trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    const repositoryPath = normalizeRepositoryPath(decodeURIComponent(url.pathname));
    if (url.protocol === "file:") return `file:${repositoryPath}`;
    if (url.host) return joinHostAndPath(url.host, repositoryPath);
  } catch {
    // SCP-style Git origins and local paths are handled below.
  }

  if (/^[A-Za-z]:[\\/]/.test(value)) return normalizeRepositoryPath(value);

  const scpMatch = /^(?:[^@/\s]+@)?([^:/\s]+):(.+)$/.exec(value);
  if (scpMatch) return joinHostAndPath(scpMatch[1]!, scpMatch[2]!);

  return normalizeRepositoryPath(value);
}

function joinHostAndPath(host: string, repositoryPath: string): string {
  const normalizedHost = host.trim().toLowerCase();
  const normalizedPath = normalizeRepositoryPath(repositoryPath);
  return normalizedPath ? `${normalizedHost}/${normalizedPath}` : normalizedHost;
}

function normalizeRepositoryPath(repositoryPath: string): string {
  return repositoryPath
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.git$/i, "");
}
