import { createFunnelProps } from "../lib/create-telemetry";
import { CliCancelledError, CreateError, telemetry } from "../lib/telemetry";
import { Authenticator } from "./authenticator";

// Thesys console OAuth + key mint (same flow as create-c1-app). The OpenUI Cloud
// master key is the same C1-flavored org API key (usageType "C1").
const THESYS_API_URL = "https://api.app.thesys.dev";
const THESYS_ISSUER_URL = "https://api.app.thesys.dev/oidc";
const THESYS_CLIENT_ID = "create-c1-app"; // public PKCE client (no secret)
export const THESYS_KEYS_URL = "https://console.thesys.dev/keys";

/** Words of [A-Za-z0-9_], hyphen-separated. */
const API_KEY_NAME = /^[A-Za-z][\w]*(?:-[\w]+)*$/;

export function assertValidApiKeyName(name: string): void {
  if (!API_KEY_NAME.test(name)) {
    throw new CreateError(
      "args_resolution",
      `Invalid --name "${name}". Use letters, digits, underscores, and hyphens, and start with a letter.`,
      "invalid_input",
      "INVALID_API_KEY_NAME",
    );
  }
}

export type CloudAuthMethod = "oauth" | "manual" | "skip";
/** How the cloud key was obtained (for telemetry) — auth method + the `--api-key` flag case. */
export type ResolvedAuthMethod = CloudAuthMethod | "apikey-flag";

type CloudAuthFailureStage =
  | "method_resolution"
  | "manual_key_prompt"
  | "oidc_discovery"
  | "browser_auth"
  | "userinfo"
  | "organization"
  | "key_mint_request"
  | "key_mint_response";

export class CloudAuthError extends CreateError {
  constructor(
    authFailureStage: CloudAuthFailureStage,
    errorCode: string,
    message: string,
    httpStatus?: number,
  ) {
    super("cloud_auth", message, "authentication", errorCode, {
      auth_failure_stage: authFailureStage,
      ...(httpStatus ? { http_status: httpStatus } : {}),
    });
    this.name = "CloudAuthError";
  }
}

async function cloudAuthStep<T>(
  stage: CloudAuthFailureStage,
  errorCode: string,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof CloudAuthError || error instanceof CliCancelledError) throw error;
    throw new CloudAuthError(
      stage,
      errorCode,
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function cloudAuthPrompt<T>(
  stage: "method_resolution" | "manual_key_prompt",
  errorCode: string,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (error instanceof ExitPromptError) throw new CliCancelledError("cloud_auth");
    throw new CloudAuthError(
      stage,
      errorCode,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/** Sign in via the browser and mint an OpenUI Cloud API key for the user's org. */
export async function mintCloudApiKey(projectName: string): Promise<string> {
  const auth = new Authenticator({ issuerUrl: THESYS_ISSUER_URL, clientId: THESYS_CLIENT_ID });
  telemetry.capture("cli_cloud_oidc_started", {
    ...createFunnelProps("cloud_auth_started"),
    auth_method: "oauth",
  });
  await cloudAuthStep("oidc_discovery", "OIDC_DISCOVERY_FAILED", () => auth.initialize());
  const { accessToken, userInfo } = await cloudAuthStep("browser_auth", "OIDC_FAILED", () =>
    auth.authenticate(),
  );

  const { fetchUserInfo } = await import("openid-client");
  const profile = await cloudAuthStep("userinfo", "USERINFO_FAILED", () =>
    fetchUserInfo(
      auth.getClientConfig(),
      accessToken,
      (userInfo?.["sub"] as string | undefined) ?? "",
    ),
  );
  const orgId = (profile["org_claims"] as { orgId: string }[] | undefined)?.[0]?.orgId;
  if (!orgId) {
    throw new CloudAuthError(
      "organization",
      "ORG_NOT_FOUND",
      `No organization found for your account. Create a key at ${THESYS_KEYS_URL}.`,
    );
  }

  console.info("🔑 Creating an OpenUI Cloud API key…");
  const res = await cloudAuthStep("key_mint_request", "API_KEY_MINT_FAILED", () =>
    fetch(`${THESYS_API_URL}/application/application.createApiKeyWithOidc`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name: projectName || "OpenUI Cloud App", orgId, usageType: "C1" }),
    }),
  );
  if (!res.ok) {
    throw new CloudAuthError(
      "key_mint_request",
      `HTTP_${res.status}`,
      `Failed to create API key (HTTP ${res.status}): ${await res.text()}`,
      res.status,
    );
  }
  const data = await cloudAuthStep(
    "key_mint_response",
    "API_KEY_RESPONSE_INVALID",
    async () => res.json() as Promise<{ apiKey?: string }>,
  );
  if (!data.apiKey) {
    throw new CloudAuthError(
      "key_mint_response",
      "API_KEY_MISSING",
      "The server did not return an API key.",
    );
  }

  const oidcSub =
    (profile["sub"] as string | undefined) ?? (userInfo?.["sub"] as string | undefined);
  if (oidcSub) telemetry.aliasOidcSubject(oidcSub);

  return data.apiKey;
}

/**
 * Resolve a cloud API key by the chosen method: an explicitly provided key, a
 * browser OAuth mint, the deprecated manual paste, or skip (null → leave the
 * .env slot empty).
 */
export async function resolveCloudApiKey(opts: {
  apiKey?: string;
  auth?: CloudAuthMethod;
  projectName: string;
  interactive: boolean;
}): Promise<{ key: string | null; method: ResolvedAuthMethod }> {
  const provided = opts.apiKey?.trim();
  if (provided) return { key: provided, method: "apikey-flag" };

  let method = opts.auth;
  if (!method) {
    if (!opts.interactive) {
      throw new CloudAuthError(
        "method_resolution",
        "AUTH_REQUIRED",
        `An API key is required in non-interactive mode. Pass --api-key <key> ` +
          `(get one at ${THESYS_KEYS_URL}).`,
      );
    }
    const { select } = await import("@inquirer/prompts");
    method = await cloudAuthPrompt(
      "method_resolution",
      "AUTH_METHOD_PROMPT_FAILED",
      () =>
        select({
          message: "Connect to OpenUI Cloud:",
          choices: [
            { name: "Sign in with Thesys (opens a browser, mints a key)", value: "oauth" },
            { name: "Skip — add THESYS_API_KEY to .env later", value: "skip" },
          ],
        }) as Promise<CloudAuthMethod>,
    );
  }

  if (method === "skip") return { key: null, method: "skip" };

  if (method === "manual") {
    if (!opts.interactive) {
      throw new CloudAuthError(
        "manual_key_prompt",
        "AUTH_REQUIRED",
        `An API key is required in non-interactive mode. Pass --api-key <key> ` +
          `(get one at ${THESYS_KEYS_URL}).`,
      );
    }
    console.warn(
      "[!] --auth manual is deprecated. Use browser sign-in or pass --api-key for scripted setup.",
    );
    const { password } = await import("@inquirer/prompts");
    const key = await cloudAuthPrompt("manual_key_prompt", "MANUAL_KEY_PROMPT_FAILED", () =>
      password({ message: "Paste your OpenUI Cloud API key:", mask: true }),
    );
    return { key: key.trim() || null, method: "manual" };
  }

  return { key: await mintCloudApiKey(opts.projectName), method: "oauth" };
}
