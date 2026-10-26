/**
 * Installation telemetry disclosure
 *
 * Sent during package postinstall unless telemetry is disabled:
 * - A random installation ID and a salted SHA-256 project ID
 * - Lang Core, Node.js, OS, architecture, and package-manager versions
 * - CI provider category, Docker status, project-ID source category, and schema version
 *
 * The JSON payload contains no direct PII or application-user data. It never includes
 * names, email addresses, usernames, raw Git origins, repository or project names,
 * filesystem paths, branches, commits, credentials, environment values, source code,
 * prompts, messages, generated output, component or tool definitions, errors, logs,
 * stack traces, routes, or UI interactions. As with any HTTP request, the telemetry
 * proxy and PostHog can observe the source IP as transport metadata; the script does
 * not read it or add it to the payload.
 */
import { id as ciInfoId, isCI as ciInfoIsCI } from "ci-info";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
  type WriteFileOptions,
} from "node:fs";
import { homedir, release } from "node:os";
import path from "node:path";
import {
  getPostHogConfig,
  isTelemetryDisabled,
  isTruthyEnv,
  normalizeProjectIdentity,
  PROJECT_ID_SALT,
  TELEMETRY_REQUEST_TIMEOUT_MS,
  TELEMETRY_SCHEMA_VERSION,
} from "./shared";

export { isTelemetryDisabled, isTruthyEnv, normalizeProjectIdentity };

export const INSTALL_EVENT = "openui_lang_core_installed";

export type ProjectIdSource = "git_origin" | "repository_url" | "install_root";
export type PackageManagerName = "npm" | "pnpm" | "yarn" | "bun" | "unknown";

export interface InstallTelemetryProperties extends Record<string, unknown> {
  telemetry_schema_version: number;
  project_id: string;
  project_id_source: ProjectIdSource;
  lang_core_version: string;
  node_version: string;
  system_platform: string;
  system_release: string;
  system_architecture: string;
  package_manager: PackageManagerName;
  package_manager_version?: string;
  ci: boolean;
  ci_name?: string;
  is_docker: boolean;
}

export interface InstallTelemetryPayload {
  distinctId: string;
  event: typeof INSTALL_EVENT;
  properties: InstallTelemetryProperties;
}

export interface InstallTelemetryIO {
  cwd(): string;
  homedir(): string;
  readFile(file: string): string;
  writeFile(file: string, contents: string, options?: WriteFileOptions): void;
  mkdir(directory: string): void;
  rename(from: string, to: string): void;
  link(existing: string, target: string): void;
  unlink(file: string): void;
  getGitOrigin(projectRoot: string): string | undefined;
  platform: string;
  architecture: string;
  release(): string;
  randomUUID(): string;
  isDocker(): boolean;
  stdout(message: string): void;
  stderr(message: string): void;
}

export type InstallTelemetrySender = (
  payload: InstallTelemetryPayload,
  env: NodeJS.ProcessEnv,
) => Promise<void>;

export interface RunInstallTelemetryOptions {
  env?: NodeJS.ProcessEnv;
  io?: Partial<InstallTelemetryIO>;
  send?: InstallTelemetrySender;
}

export type RunInstallTelemetryResult =
  | { status: "disabled" }
  | { status: "debug"; payload: InstallTelemetryPayload }
  | { status: "sent"; payload: InstallTelemetryPayload }
  | { status: "failed"; payload?: InstallTelemetryPayload };

interface StoredTelemetryState extends Record<string, unknown> {
  distinctId: string;
  langCorePostinstallNoticeShown?: boolean;
}

type StoredStateStatus = "missing" | "readable" | "unreadable";

interface ProjectIdentity {
  value: string;
  source: ProjectIdSource;
}

const INSTALL_NOTICE =
  "\n◆ OpenUI Lang Core sends pseudonymous installation telemetry to PostHog.\n" +
  "  It includes a salted project ID, OpenUI/Node/OS/package-manager metadata, and the network IP observed by PostHog.\n" +
  "  It does not send repository URLs, paths, source code, prompts, errors, or application data.\n" +
  "  Disable it with OPENUI_TELEMETRY_DISABLED=1 or DO_NOT_TRACK=1.\n\n";

export function hashProjectIdentity(salt: string, projectIdentity: string): string {
  return createHash("sha256").update(salt).update("\0").update(projectIdentity).digest("hex");
}

export function detectPackageManager(env: NodeJS.ProcessEnv): {
  name: PackageManagerName;
  version?: string;
} {
  const userAgent = env["npm_config_user_agent"]?.trim() ?? "";
  const match = userAgent.match(/^(npm|pnpm|yarn|bun)\/([^\s]+)/i);
  if (!match) return { name: "unknown" };

  const name = match[1]!.toLowerCase() as Exclude<PackageManagerName, "unknown">;
  const version = match[2]!.slice(0, 64);
  return version ? { name, version } : { name };
}

export async function runInstallTelemetry(
  options: RunInstallTelemetryOptions = {},
): Promise<RunInstallTelemetryResult> {
  const env = options.env ?? process.env;
  if (isTelemetryDisabled(env)) return { status: "disabled" };

  let payload: InstallTelemetryPayload | undefined;
  try {
    const io = createInstallTelemetryIO(options.io);
    const stateFile = getTelemetryStateFile(env, io);
    let { state, changed, status } = loadOrCreateState(stateFile, io);
    if (!state.langCorePostinstallNoticeShown) {
      io.stderr(INSTALL_NOTICE);
      state.langCorePostinstallNoticeShown = true;
      changed = true;
    }
    if (changed && status !== "unreadable") {
      state = persistState(stateFile, state, io, status === "missing");
    }

    const projectRoot = path.resolve(env["INIT_CWD"] || io.cwd());
    const projectIdentity = resolveProjectIdentity(projectRoot, env, io);
    const packageManager = detectPackageManager(env);

    payload = {
      distinctId: state.distinctId,
      event: INSTALL_EVENT,
      properties: {
        telemetry_schema_version: TELEMETRY_SCHEMA_VERSION,
        project_id: hashProjectIdentity(PROJECT_ID_SALT, projectIdentity.value),
        project_id_source: projectIdentity.source,
        lang_core_version:
          env["OPENUI_LANG_CORE_PACKAGE_VERSION"] || env["npm_package_version"] || "unknown",
        node_version: process.version,
        system_platform: io.platform,
        system_release: io.release(),
        system_architecture: io.architecture,
        package_manager: packageManager.name,
        ...(packageManager.version ? { package_manager_version: packageManager.version } : {}),
        ci: ciInfoIsCI,
        ...(ciInfoId ? { ci_name: ciInfoId } : {}),
        is_docker: io.isDocker(),
      },
    };

    if (isTruthyEnv(env["OPENUI_TELEMETRY_DEBUG"])) {
      io.stdout(`[OpenUI telemetry debug]\n${JSON.stringify(payload, null, 2)}\n`);
      return { status: "debug", payload };
    }

    await (options.send ?? sendToPostHog)(payload, env);
    return { status: "sent", payload };
  } catch {
    return { status: "failed", ...(payload ? { payload } : {}) };
  }
}

function createInstallTelemetryIO(overrides: Partial<InstallTelemetryIO> = {}): InstallTelemetryIO {
  return {
    cwd: () => process.cwd(),
    homedir,
    readFile: (file) => readFileSync(file, "utf8"),
    writeFile: (file, contents, options) => writeFileSync(file, contents, options),
    mkdir: (directory) => mkdirSync(directory, { recursive: true, mode: 0o700 }),
    rename: renameSync,
    link: linkSync,
    unlink: unlinkSync,
    getGitOrigin: defaultGetGitOrigin,
    platform: process.platform,
    architecture: process.arch,
    release,
    randomUUID,
    isDocker: defaultIsDocker,
    stdout: (message) => process.stdout.write(message),
    stderr: (message) => process.stderr.write(message),
    ...overrides,
  };
}

function getTelemetryStateFile(env: NodeJS.ProcessEnv, io: InstallTelemetryIO): string {
  const configRoot = env["XDG_CONFIG_HOME"] || path.join(io.homedir(), ".config");
  return path.join(configRoot, "openui", "telemetry.json");
}

function readStoredState(
  stateFile: string,
  io: InstallTelemetryIO,
): { stored: Record<string, unknown>; status: StoredStateStatus } {
  let contents: string;
  try {
    contents = io.readFile(stateFile);
  } catch (error) {
    // State that exists but cannot be read is left untouched.
    return { stored: {}, status: hasErrorCode(error, "ENOENT") ? "missing" : "unreadable" };
  }

  try {
    const parsed = JSON.parse(contents) as unknown;
    return { stored: isRecord(parsed) ? parsed : {}, status: "readable" };
  } catch {
    // Corrupt state is replaced with a new best-effort state.
    return { stored: {}, status: "readable" };
  }
}

function getStoredDistinctId(stored: Record<string, unknown>): string | undefined {
  const distinctId = stored["distinctId"];
  return typeof distinctId === "string" && distinctId ? distinctId : undefined;
}

function loadOrCreateState(
  stateFile: string,
  io: InstallTelemetryIO,
): { state: StoredTelemetryState; changed: boolean; status: StoredStateStatus } {
  const { stored, status } = readStoredState(stateFile, io);
  const storedDistinctId = getStoredDistinctId(stored);

  return {
    state: {
      ...stored,
      distinctId: storedDistinctId ?? io.randomUUID(),
      langCorePostinstallNoticeShown: stored["langCorePostinstallNoticeShown"] === true,
    },
    // Only a newly created identity needs to be written back.
    changed: !storedDistinctId,
    status,
  };
}

/**
 * Writes the state without exposing partial files to concurrent installs. New state is published
 * only if no other process created it first; otherwise that process's identity is reused.
 */
function persistState(
  stateFile: string,
  state: StoredTelemetryState,
  io: InstallTelemetryIO,
  create: boolean,
): StoredTelemetryState {
  const contents = JSON.stringify(state);
  const temporaryFile = `${stateFile}.${io.randomUUID()}.tmp`;
  try {
    io.mkdir(path.dirname(stateFile));
    io.writeFile(temporaryFile, contents, { mode: 0o600, flag: "wx" });

    if (!create) {
      io.rename(temporaryFile, stateFile);
      return state;
    }

    try {
      io.link(temporaryFile, stateFile);
      return state;
    } catch (error) {
      if (!hasErrorCode(error, "EEXIST")) {
        // Filesystems without hard links still get a create-only write.
        try {
          io.writeFile(stateFile, contents, { mode: 0o600, flag: "wx" });
          return state;
        } catch (fallbackError) {
          if (!hasErrorCode(fallbackError, "EEXIST")) throw fallbackError;
        }
      }
    }

    const winnerDistinctId = getStoredDistinctId(readStoredState(stateFile, io).stored);
    return winnerDistinctId ? { ...state, distinctId: winnerDistinctId } : state;
  } catch {
    // Read-only or ephemeral environments use the in-memory state for this run.
    return state;
  } finally {
    try {
      io.unlink(temporaryFile);
    } catch {
      // The temporary file was renamed into place or never created.
    }
  }
}

function hasErrorCode(error: unknown, code: string): boolean {
  return isRecord(error) && error["code"] === code;
}

function resolveProjectIdentity(
  projectRoot: string,
  env: NodeJS.ProcessEnv,
  io: InstallTelemetryIO,
): ProjectIdentity {
  const gitOrigin = io.getGitOrigin(projectRoot)?.trim();
  if (gitOrigin) {
    return { value: normalizeProjectIdentity(gitOrigin), source: "git_origin" };
  }

  const repositoryUrl = env["REPOSITORY_URL"]?.trim();
  if (repositoryUrl) {
    return {
      value: normalizeProjectIdentity(repositoryUrl),
      source: "repository_url",
    };
  }

  return { value: projectRoot, source: "install_root" };
}

function defaultGetGitOrigin(projectRoot: string): string | undefined {
  try {
    return execFileSync("git", ["-C", projectRoot, "config", "--get", "remote.origin.url"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 1000,
    }).trim();
  } catch {
    return undefined;
  }
}

function defaultIsDocker(): boolean {
  if (existsSync("/.dockerenv")) return true;
  try {
    return /docker|containerd|kubepods/i.test(readFileSync("/proc/self/cgroup", "utf8"));
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function sendToPostHog(
  payload: InstallTelemetryPayload,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  const postHog = getPostHogConfig(env);
  const response = await fetch(postHog.captureUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: postHog.apiKey,
      event: payload.event,
      properties: {
        distinct_id: payload.distinctId,
        ...payload.properties,
      },
    }),
    signal: AbortSignal.timeout(TELEMETRY_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`PostHog capture failed: ${response.status}`);
}
