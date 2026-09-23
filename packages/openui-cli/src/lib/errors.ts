import type { CommandResult } from "./process-runner";

/** Thrown by command funnels so the index wrapper can attribute the failure stage + drain once. */
export type CliErrorClass =
  | "invalid_input"
  | "filesystem"
  | "authentication"
  | "dependency"
  | "peer_dependency"
  | "registry_auth"
  | "network"
  | "package_compatibility"
  | "workspace_config"
  | "install_script"
  | "process"
  | "user_cancelled"
  | "generation"
  | "unknown";

export type CliErrorMetadata = {
  duration_ms?: number;
  exit_code?: number;
  failure_signal?: NodeJS.Signals;
  http_status?: number;
  cancellation_exit_code?: number;
  auth_failure_stage?: string;
  attempts?: number;
};

export class CreateError extends Error {
  constructor(
    public stage: string,
    message: string,
    public errorClass: CliErrorClass = "unknown",
    public errorCode = "UNKNOWN",
    public errorMetadata: CliErrorMetadata = {},
  ) {
    super(message);
    this.name = "CreateError";
  }
}

export class CliCancelledError extends CreateError {
  constructor(
    stage: string,
    public exitCode = 0,
    metadata: CliErrorMetadata = {},
  ) {
    super(
      stage,
      "Operation cancelled.",
      "user_cancelled",
      exitCode === 0 ? "USER_CANCELLED" : exitCode === 143 ? "TERMINATED" : "INTERRUPTED",
      { ...metadata, cancellation_exit_code: exitCode },
    );
    this.name = "CliCancelledError";
  }
}

export type CliErrorProperties = CliErrorMetadata & {
  failure_stage: string;
  error_class: CliErrorClass;
  error_code: string;
};

const errnoTelemetry: Record<string, Pick<CliErrorProperties, "error_class" | "error_code">> = {
  EACCES: { error_class: "filesystem", error_code: "PERMISSION_DENIED" },
  EPERM: { error_class: "filesystem", error_code: "PERMISSION_DENIED" },
  ENOENT: { error_class: "filesystem", error_code: "NOT_FOUND" },
  ENOSPC: { error_class: "filesystem", error_code: "DISK_FULL" },
};

/** Return only bounded values; never forward an error message or stack. */
export function cliErrorProperties(
  error: unknown,
  fallback: CliErrorProperties = {
    failure_stage: "unknown",
    error_class: "unknown",
    error_code: "UNKNOWN",
  },
): CliErrorProperties {
  if (error instanceof CreateError) {
    return {
      failure_stage: error.stage,
      error_class: error.errorClass,
      error_code: error.errorCode,
      ...error.errorMetadata,
    };
  }

  const errno = error instanceof Error ? (error as NodeJS.ErrnoException).code : undefined;
  const classified = errno ? errnoTelemetry[errno] : undefined;
  return classified ? { ...fallback, ...classified } : fallback;
}

type ProcessFailureRule = {
  fingerprints: readonly string[];
  prefixes?: readonly string[];
  errorClass: CliErrorClass;
  errorCode: string;
};

const processFailureRules = [
  {
    fingerprints: ["ERR_PNPM_PEER_DEP_ISSUES", "YN0002", "YN0060", "ERESOLVE"],
    errorClass: "peer_dependency",
    errorCode: "PEER_DEPENDENCY",
  },
  {
    fingerprints: ["ERR_PNPM_FETCH_401", "E401", "ENEEDAUTH"],
    errorClass: "registry_auth",
    errorCode: "REGISTRY_401",
  },
  {
    fingerprints: ["ERR_PNPM_FETCH_403", "E403"],
    errorClass: "registry_auth",
    errorCode: "REGISTRY_403",
  },
  {
    fingerprints: ["ERR_PNPM_FETCH_404", "E404"],
    errorClass: "dependency",
    errorCode: "PACKAGE_NOT_FOUND",
  },
  {
    fingerprints: ["ENOTFOUND", "EAI_AGAIN"],
    errorClass: "network",
    errorCode: "DNS_FAILED",
  },
  {
    fingerprints: ["ETIMEDOUT", "ESOCKETTIMEDOUT", "ERR_SOCKET_TIMEOUT"],
    errorClass: "network",
    errorCode: "NETWORK_TIMEOUT",
  },
  {
    fingerprints: ["ECONNRESET", "ECONNREFUSED", "EHOSTUNREACH", "ENETUNREACH"],
    errorClass: "network",
    errorCode: "NETWORK_FAILED",
  },
  {
    fingerprints: [
      "ERR_PNPM_UNSUPPORTED_ENGINE",
      "ERR_PNPM_BAD_PM_VERSION",
      "EBADENGINE",
      "YN0009",
    ],
    errorClass: "package_compatibility",
    errorCode: "ENGINE_MISMATCH",
  },
  {
    fingerprints: ["ERR_PNPM_NO_MATCHING_VERSION", "ETARGET"],
    errorClass: "package_compatibility",
    errorCode: "NO_MATCHING_VERSION",
  },
  {
    fingerprints: ["ERR_PNPM_OUTDATED_LOCKFILE", "ERR_PNPM_LOCKFILE_BREAKING_CHANGE"],
    errorClass: "workspace_config",
    errorCode: "LOCKFILE_INCOMPATIBLE",
  },
  {
    fingerprints: ["ERR_PNPM_NO_MATCHING_VERSION_INSIDE_WORKSPACE"],
    prefixes: ["ERR_PNPM_WORKSPACE_"],
    errorClass: "workspace_config",
    errorCode: "WORKSPACE_CONFIG_INVALID",
  },
  {
    fingerprints: ["ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL", "ELIFECYCLE"],
    errorClass: "install_script",
    errorCode: "INSTALL_SCRIPT_FAILED",
  },
  {
    fingerprints: ["EACCES", "EPERM"],
    errorClass: "filesystem",
    errorCode: "PERMISSION_DENIED",
  },
  {
    fingerprints: ["ENOSPC", "EDQUOT"],
    errorClass: "filesystem",
    errorCode: "DISK_FULL",
  },
] satisfies readonly ProcessFailureRule[];

function classifyProcessDiagnostic(diagnostic: string): ProcessFailureRule | undefined {
  const tokens = diagnostic.toUpperCase().match(/\b[A-Z][A-Z0-9_]{2,}\b/g) ?? [];
  const tokenSet = new Set(tokens);
  return processFailureRules.find(
    ({ fingerprints, prefixes }) =>
      fingerprints.some((fingerprint) => tokenSet.has(fingerprint)) ||
      prefixes?.some((prefix) => tokens.some((token) => token.startsWith(prefix))),
  );
}

export function processErrorProperties(
  result: CommandResult,
  failureStage: string,
  fallback: Pick<CliErrorProperties, "error_class" | "error_code">,
): CliErrorProperties {
  const metadata: CliErrorMetadata = {
    duration_ms: result.durationMs,
    ...(typeof result.status === "number" ? { exit_code: result.status } : {}),
    ...(result.signal ? { failure_signal: result.signal } : {}),
  };
  const cancellationExitCode =
    result.signal === "SIGINT" || result.status === 130
      ? 130
      : result.signal === "SIGTERM" || result.status === 143
        ? 143
        : undefined;
  if (cancellationExitCode) {
    return {
      failure_stage: failureStage,
      error_class: "user_cancelled",
      error_code: cancellationExitCode === 130 ? "INTERRUPTED" : "TERMINATED",
      ...metadata,
      cancellation_exit_code: cancellationExitCode,
    };
  }

  const diagnostic = `${result.error?.message ?? ""}\n${result.diagnosticTail}`;
  const rule = classifyProcessDiagnostic(diagnostic);
  if (rule) {
    return {
      failure_stage: failureStage,
      error_class: rule.errorClass,
      error_code: rule.errorCode,
      ...metadata,
    };
  }

  const spawnCode = result.error ? (result.error as NodeJS.ErrnoException).code : undefined;
  if (spawnCode === "ENOENT") {
    return {
      failure_stage: failureStage,
      error_class: "process",
      error_code: "COMMAND_NOT_FOUND",
      ...metadata,
    };
  }

  return { failure_stage: failureStage, ...fallback, ...metadata };
}

const DEFAULT_PROCESS_FALLBACK: Pick<CliErrorProperties, "error_class" | "error_code"> = {
  error_class: "process",
  error_code: "NONZERO_EXIT",
};

/** Throw a typed CLI error (or cancellation) from a failed child process. */
export function throwCommandFailure(
  result: CommandResult,
  stage: string,
  message: string,
  fallback: Pick<CliErrorProperties, "error_class" | "error_code"> = DEFAULT_PROCESS_FALLBACK,
): never {
  const properties = processErrorProperties(result, stage, fallback);
  if (properties.error_class === "user_cancelled") {
    throw new CliCancelledError(stage, properties.cancellation_exit_code ?? 0, properties);
  }
  const { failure_stage, error_class, error_code, ...metadata } = properties;
  throw new CreateError(failure_stage, message, error_class, error_code, metadata);
}
