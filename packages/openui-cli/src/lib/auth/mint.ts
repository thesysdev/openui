import { CliCancelledError, CreateError } from "../errors";
import { Authenticator } from "./authenticator";
import type { AuthTelemetryClient } from "./telemetry";

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

/** How the cloud key was obtained (for telemetry). */
export type ResolvedAuthMethod = "oauth" | "skip";

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
export async function mintCloudApiKey(
  projectName: string,
  tel: AuthTelemetryClient,
): Promise<string> {
  const auth = new Authenticator({ issuerUrl: THESYS_ISSUER_URL, clientId: THESYS_CLIENT_ID });
  tel.trackOidcStarted();
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
  if (oidcSub) tel.aliasOidcSubject(oidcSub);

  return data.apiKey;
}

/** Wait for any key. Ctrl+C rejects with ExitPromptError, like every other prompt. */
async function pressAnyKey(message: string): Promise<void> {
  const { createPrompt, makeTheme, useKeypress, usePrefix, useState } =
    await import("@inquirer/core");
  const prompt = createPrompt<void, { message: string }>((config, done) => {
    const [status, setStatus] = useState<"idle" | "done">("idle");
    const theme = makeTheme();
    const prefix = usePrefix({ status, theme });
    useKeypress((key) => {
      // readline already turned Ctrl+C into SIGINT; don't also treat it as "any key".
      if (status !== "idle" || (key.ctrl && key.name === "c")) return;
      setStatus("done");
      done();
    });
    return `${prefix} ${theme.style.message(config.message, status)}`;
  });
  await prompt({ message });
}

/**
 * Resolve a cloud API key: a browser OAuth mint, or skip (null → leave the
 * .env slot empty) when nobody is there to sign in. There's no skip choice in a
 * terminal: Ctrl+C is the way out.
 */
export async function resolveCloudApiKey(opts: {
  projectName: string;
  interactive: boolean;
  tel: AuthTelemetryClient;
}): Promise<{ key: string | null; method: ResolvedAuthMethod }> {
  // Nobody is there to sign in: leave the .env slot empty and let the
  // closing message point at `generate-api-key`.
  if (!opts.interactive) return { key: null, method: "skip" };
  await cloudAuthPrompt("method_resolution", "AUTH_METHOD_PROMPT_FAILED", () =>
    pressAnyKey("Press any key to sign in and generate your API key (opens a browser)"),
  );
  return { key: await mintCloudApiKey(opts.projectName, opts.tel), method: "oauth" };
}
