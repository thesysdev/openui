import type { PromptSpec } from "../parser/prompt";
import type { ParseResult, ValidationErrorCode } from "../parser/types";
import {
  getPostHogConfig,
  isRuntimeTelemetryEnabled,
  normalizeProjectIdentity,
  TELEMETRY_REQUEST_TIMEOUT_MS,
  TELEMETRY_SCHEMA_VERSION,
} from "./shared";

/**
 * Telemetry disclosure
 *
 * Opt-in: nothing is sent unless OPENUI_RUNTIME_TELEMETRY_ENABLED=1 is set.
 *
 * Sent for sampled server-side system-prompt generations:
 * - Event timestamp, SDK and runtime versions, environment, CI status, and CI provider category
 * - API input shape, component count, tool count, and schema/sample versions
 * - Random event and runtime identifiers
 * - A locally computed SHA-256 prompt-configuration hash
 * - A locally computed SHA-256 project hash when a project identifier is available
 *
 * Sent for sampled server-side createParser().parse() calls:
 * - The same event/runtime metadata and optional locally computed project hash
 * - Outcome, incomplete/root booleans, structural counts, and fixed validation-code counts
 *
 * The configuration hash covers the root component, component names, signatures and
 * descriptions, component groups and notes, and generation-mode flags. The project hash
 * uses the normalized Git origin, REPOSITORY_URL, or working directory. Only the hashes
 * are sent.
 *
 * Not sent:
 * - Prompts, preambles, examples, additional rules, OpenUI Lang source, or generated output
 * - Raw component definitions, tool definitions, or tool examples
 * - Component/prop/statement names, error messages/paths, unresolved/orphaned names, or exceptions
 * - Git origins, working-directory paths, credentials, user identifiers, or chat data
 *
 * Browser and browser-worker environments never send this telemetry.
 */
declare const __OPENUI_LANG_CORE_VERSION__: string;

const SYSTEM_PROMPT_EVENT_NAME = "lang_core_system_prompt_generation_used";
const PARSER_PARSE_EVENT_NAME = "lang_core_parser_parse_used";
const SYSTEM_PROMPT_SAMPLE_RATE = 0.1;
const PARSER_PARSE_SAMPLE_RATE = 0.1;
const SDK_VERSION =
  typeof __OPENUI_LANG_CORE_VERSION__ === "string"
    ? __OPENUI_LANG_CORE_VERSION__
    : "0.0.0-development";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type InputShape = "library_spec" | "legacy_prompt_spec";
type Environment = "production" | "development" | "test" | "unknown";
type RuntimeName = "node" | "bun" | "deno" | "edge";

interface ProcessLike {
  cwd?: () => string;
  env?: Record<string, string | undefined>;
  getBuiltinModule?: (specifier: string) => unknown;
  release?: { name?: string };
  versions?: Record<string, string | undefined>;
}

interface RuntimeInfo {
  name: RuntimeName;
  version?: string;
  env?: Record<string, string | undefined>;
  process?: ProcessLike;
}

interface TelemetryState {
  projectHash?: Promise<string | undefined>;
  runtimeId: string;
}

interface SystemPromptCaptureProperties {
  distinct_id: string;
  $process_person_profile: false;
  event_id: string;
  telemetry_schema_version: typeof TELEMETRY_SCHEMA_VERSION;
  system_prompt_config_hash_version: 1;
  system_prompt_config_hash: string;
  project_hash_version?: 1;
  project_hash?: string;
  component_count: number;
  tool_count: number;
  sdk_name: "@openuidev/lang-core";
  sdk_version: string;
  api_surface: "generate_system_prompt";
  input_shape: InputShape;
  runtime: RuntimeName;
  runtime_version?: string;
  environment: Environment;
  ci: boolean;
  ci_name?: string;
  sample_rate: typeof SYSTEM_PROMPT_SAMPLE_RATE;
}

type ParserParseOutcome = "valid" | "invalid" | "no_renderable_root" | "threw";

interface ParserParseResultProperties {
  outcome: Exclude<ParserParseOutcome, "threw">;
  incomplete: boolean;
  has_renderable_root: boolean;
  statement_count: number;
  unresolved_count: number;
  orphaned_count: number;
  validation_error_count: number;
  unknown_component_count: number;
  missing_required_count: number;
  null_required_count: number;
  inline_reserved_count: number;
  excess_args_count: number;
}

interface ParserParseThrownProperties {
  outcome: "threw";
}

type ParserParseOutcomeProperties = ParserParseResultProperties | ParserParseThrownProperties;

interface ParserParseCaptureProperties {
  distinct_id: string;
  $process_person_profile: false;
  event_id: string;
  telemetry_schema_version: typeof TELEMETRY_SCHEMA_VERSION;
  project_hash_version?: 1;
  project_hash?: string;
  sdk_name: "@openuidev/lang-core";
  sdk_version: string;
  api_surface: "parser.parse";
  runtime: RuntimeName;
  runtime_version?: string;
  environment: Environment;
  ci: boolean;
  ci_name?: string;
  sample_rate: typeof PARSER_PARSE_SAMPLE_RATE;
}

export interface ParserParseCaptureContext {
  state: TelemetryState;
  runtime: RuntimeInfo;
  environment: Environment;
}

interface CiInfoSnapshot {
  id: string | null;
  isCI: boolean;
}

const STATE_KEY = Symbol.for("@openuidev/lang-core/telemetry/v1");

export function buildSystemPromptConfigProjection(spec: PromptSpec): Json {
  const hasTools = (spec.tools?.length ?? 0) > 0;
  const toolCalls = spec.toolCalls ?? hasTools;
  const bindings = spec.bindings ?? toolCalls;

  const components = Object.entries(spec.components)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, component]) => ({
      name,
      signature: component.signature,
      description: component.description ?? null,
    }));

  const componentGroups = (spec.componentGroups ?? [])
    .map((group) => ({
      name: group.name,
      components: [...group.components].sort(),
      notes: [...(group.notes ?? [])],
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    root: spec.root ?? "Root",
    components,
    componentGroups,
    modes: {
      toolCalls,
      bindings,
      editMode: spec.editMode === true,
      inlineMode: spec.inlineMode === true,
    },
  };
}

async function sha256(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto is unavailable");

  const bytes = new TextEncoder().encode(value);
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function calculateSystemPromptConfigHash(spec: PromptSpec): Promise<string> {
  // The projection constructs object keys deterministically and sorts unordered collections.
  const canonicalJson = JSON.stringify(buildSystemPromptConfigProjection(spec));
  return sha256(canonicalJson);
}

function getProcess(): ProcessLike | undefined {
  const candidate = (globalThis as typeof globalThis & { process?: unknown }).process;
  if (!candidate || typeof candidate !== "object") return undefined;
  return candidate as ProcessLike;
}

function hasBrowserWindow(): boolean {
  const target = globalThis as typeof globalThis & {
    document?: unknown;
    navigator?: { product?: string };
    window?: unknown;
  };
  return target.navigator?.product === "ReactNative" || Boolean(target.window && target.document);
}

function isBrowserWorker(): boolean {
  const target = globalThis as typeof globalThis & {
    WorkerGlobalScope?: { prototype: object };
  };
  const workerGlobalScope = target.WorkerGlobalScope;
  return Boolean(workerGlobalScope && workerGlobalScope.prototype.isPrototypeOf(globalThis));
}

function detectRuntime(): RuntimeInfo | undefined {
  if (hasBrowserWindow()) return undefined;

  const target = globalThis as typeof globalThis & {
    Bun?: { version?: string };
    Deno?: {
      version?: { deno?: string };
    };
    EdgeRuntime?: unknown;
    WebSocketPair?: unknown;
  };
  const processLike = getProcess();

  if (target.Bun && typeof target.Bun === "object") {
    return {
      name: "bun",
      version: target.Bun.version,
      env: processLike?.env,
      process: processLike,
    };
  }

  if (target.Deno && typeof target.Deno === "object") {
    return { name: "deno", version: target.Deno.version?.deno };
  }

  if (typeof target.EdgeRuntime === "string") {
    return { name: "edge", version: target.EdgeRuntime };
  }

  if (typeof target.WebSocketPair === "function") {
    return { name: "edge" };
  }

  if (isBrowserWorker()) return undefined;

  if (
    processLike?.release?.name === "node" ||
    (typeof processLike?.versions?.node === "string" && processLike.versions.node.length > 0)
  ) {
    return {
      name: "node",
      version: processLike.versions?.node,
      env: processLike.env,
      process: processLike,
    };
  }

  return undefined;
}

function getEnvironment(env: Record<string, string | undefined> | undefined): Environment {
  const value = env?.NODE_ENV;
  if (value === "production" || value === "development" || value === "test") return value;
  return "unknown";
}

function getState(): TelemetryState {
  const registry = globalThis as typeof globalThis & { [STATE_KEY]?: TelemetryState };
  registry[STATE_KEY] ??= {
    runtimeId: globalThis.crypto.randomUUID(),
  };
  return registry[STATE_KEY];
}

function readGitOrigin(processLike: ProcessLike): Promise<string | undefined> {
  const childProcess = processLike.getBuiltinModule?.("node:child_process") as
    | {
        execFile?: (
          file: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (error: unknown, stdout?: string) => void,
        ) => unknown;
      }
    | undefined;
  const execFile = childProcess?.execFile;
  if (!execFile) return Promise.resolve(undefined);

  // Repository discovery happens at most once and must never block the event loop.
  return new Promise((resolve) => {
    try {
      execFile(
        "git",
        ["config", "--local", "--get", "remote.origin.url"],
        {
          encoding: "utf8",
          timeout: 1_000,
          windowsHide: true,
        },
        (error, stdout) => {
          const origin = stdout?.trim();
          resolve(error || !origin ? undefined : origin);
        },
      );
    } catch {
      resolve(undefined);
    }
  });
}

async function getRepositoryIdentifier(
  processLike: ProcessLike | undefined,
): Promise<string | undefined> {
  if (!processLike) return undefined;

  const rawValue =
    (await readGitOrigin(processLike)) || processLike.env?.REPOSITORY_URL || processLike.cwd?.();
  return rawValue ? normalizeProjectIdentity(rawValue) || undefined : undefined;
}

export function calculateProjectHash(repositoryIdentifier: string): Promise<string> {
  const normalized = normalizeProjectIdentity(repositoryIdentifier);
  if (!normalized) return Promise.reject(new TypeError("Repository identifier is empty"));
  return sha256(normalized);
}

function getProjectHash(state: TelemetryState, runtime: RuntimeInfo): Promise<string | undefined> {
  if (runtime.name !== "node") return Promise.resolve(undefined);

  state.projectHash ??= Promise.resolve()
    .then(() => getRepositoryIdentifier(runtime.process))
    .then((identifier) => (identifier ? calculateProjectHash(identifier) : undefined))
    .catch(() => undefined);
  return state.projectHash;
}

async function getCIInfo(runtime: RuntimeInfo): Promise<CiInfoSnapshot> {
  if (!runtime.env) return { id: null, isCI: false };

  try {
    const ciInfo = await import("ci-info");
    return { id: ciInfo.id, isCI: ciInfo.isCI };
  } catch {
    return { id: null, isCI: false };
  }
}

async function postCapture(
  event: string,
  properties:
    SystemPromptCaptureProperties | (ParserParseCaptureProperties & ParserParseOutcomeProperties),
  runtime: RuntimeInfo,
): Promise<void> {
  const postHog = getPostHogConfig(runtime.env);
  await globalThis.fetch(postHog.captureUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: postHog.apiKey,
      event,
      timestamp: new Date().toISOString(),
      properties,
    }),
    keepalive: true,
    signal: globalThis.AbortSignal.timeout(TELEMETRY_REQUEST_TIMEOUT_MS),
  });
}

async function sendSystemPromptCapture(
  state: TelemetryState,
  spec: PromptSpec,
  configHash: Promise<string>,
  inputShape: InputShape,
  runtime: RuntimeInfo,
  environment: Environment,
): Promise<void> {
  const [systemPromptConfigHash, projectHash, ciInfo] = await Promise.all([
    configHash,
    getProjectHash(state, runtime),
    getCIInfo(runtime),
  ]);

  const properties: SystemPromptCaptureProperties = {
    distinct_id: state.runtimeId,
    $process_person_profile: false,
    event_id: globalThis.crypto.randomUUID(),
    telemetry_schema_version: TELEMETRY_SCHEMA_VERSION,
    system_prompt_config_hash_version: 1,
    system_prompt_config_hash: systemPromptConfigHash,
    component_count: Object.keys(spec.components).length,
    tool_count: spec.tools?.length ?? 0,
    sdk_name: "@openuidev/lang-core",
    sdk_version: SDK_VERSION,
    api_surface: "generate_system_prompt",
    input_shape: inputShape,
    runtime: runtime.name,
    runtime_version: runtime.version,
    environment,
    ci: ciInfo.isCI,
    ...(ciInfo.id ? { ci_name: ciInfo.id } : {}),
    sample_rate: SYSTEM_PROMPT_SAMPLE_RATE,
    ...(projectHash
      ? {
          project_hash_version: 1 as const,
          project_hash: projectHash,
        }
      : {}),
  };

  await postCapture(SYSTEM_PROMPT_EVENT_NAME, properties, runtime);
}

export function recordSystemPromptGeneration(spec: PromptSpec, inputShape: InputShape): void {
  try {
    const runtime = detectRuntime();
    if (
      !runtime ||
      typeof globalThis.fetch !== "function" ||
      !globalThis.crypto?.subtle ||
      typeof globalThis.crypto.randomUUID !== "function" ||
      typeof globalThis.AbortSignal?.timeout !== "function"
    ) {
      return;
    }

    const env = runtime.env;
    const environment = getEnvironment(env);
    if (!isRuntimeTelemetryEnabled(env)) return;

    // Reject 90% of calls before projection, hashing, repository lookup, or payload allocation.
    if (Math.random() >= SYSTEM_PROMPT_SAMPLE_RATE) return;

    const state = getState();
    const configHash = calculateSystemPromptConfigHash(spec);

    void Promise.resolve()
      .then(() =>
        sendSystemPromptCapture(state, spec, configHash, inputShape, runtime, environment),
      )
      .catch(() => undefined);
  } catch {
    // Telemetry must never affect prompt generation.
  }
}

function getValidationErrorCounts(
  result: ParseResult,
): Omit<
  ParserParseResultProperties,
  | "outcome"
  | "incomplete"
  | "has_renderable_root"
  | "statement_count"
  | "unresolved_count"
  | "orphaned_count"
  | "validation_error_count"
> {
  const counts: Record<ValidationErrorCode, number> = {
    "type-mismatch": 0,
    "unknown-component": 0,
    "missing-required": 0,
    "null-required": 0,
    "inline-reserved": 0,
    "excess-args": 0,
    "type-mismatch": 0,
    "unknown-function": 0,
    "no-root": 0,
  };

  for (const error of result.meta.errors) counts[error.code] += 1;

  return {
    unknown_component_count: counts["unknown-component"],
    missing_required_count: counts["missing-required"],
    null_required_count: counts["null-required"],
    inline_reserved_count: counts["inline-reserved"],
    excess_args_count: counts["excess-args"],
  };
}

function summarizeParserParse(result: ParseResult): ParserParseResultProperties {
  return {
    outcome:
      result.meta.errors.length > 0 ? "invalid" : result.root ? "valid" : "no_renderable_root",
    incomplete: result.meta.incomplete,
    has_renderable_root: result.root !== null,
    statement_count: result.meta.statementCount,
    unresolved_count: result.meta.unresolved.length,
    orphaned_count: result.meta.orphaned.length,
    validation_error_count: result.meta.errors.length,
    ...getValidationErrorCounts(result),
  };
}

async function sendParserParseCapture(
  context: ParserParseCaptureContext,
  outcome: ParserParseOutcomeProperties,
): Promise<void> {
  const { state, runtime, environment } = context;
  const [projectHash, ciInfo] = await Promise.all([
    getProjectHash(state, runtime),
    getCIInfo(runtime),
  ]);

  const properties: ParserParseCaptureProperties & ParserParseOutcomeProperties = {
    distinct_id: state.runtimeId,
    $process_person_profile: false,
    event_id: globalThis.crypto.randomUUID(),
    telemetry_schema_version: TELEMETRY_SCHEMA_VERSION,
    sdk_name: "@openuidev/lang-core",
    sdk_version: SDK_VERSION,
    api_surface: "parser.parse",
    runtime: runtime.name,
    runtime_version: runtime.version,
    environment,
    ci: ciInfo.isCI,
    ...(ciInfo.id ? { ci_name: ciInfo.id } : {}),
    sample_rate: PARSER_PARSE_SAMPLE_RATE,
    ...outcome,
    ...(projectHash
      ? {
          project_hash_version: 1 as const,
          project_hash: projectHash,
        }
      : {}),
  };

  await postCapture(PARSER_PARSE_EVENT_NAME, properties, runtime);
}

export function prepareParserParseTelemetry(): ParserParseCaptureContext | undefined {
  try {
    const runtime = detectRuntime();
    if (
      !runtime ||
      typeof globalThis.fetch !== "function" ||
      typeof globalThis.crypto?.randomUUID !== "function" ||
      typeof globalThis.AbortSignal?.timeout !== "function"
    ) {
      return undefined;
    }

    const env = runtime.env;
    if (!isRuntimeTelemetryEnabled(env)) return undefined;

    // Reject 90% of calls before telemetry state, project lookup, or payload allocation.
    if (Math.random() >= PARSER_PARSE_SAMPLE_RATE) return undefined;

    return {
      state: getState(),
      runtime,
      environment: getEnvironment(env),
    };
  } catch {
    return undefined;
  }
}

export function captureParserParseResult(
  context: ParserParseCaptureContext | undefined,
  result: ParseResult,
): void {
  if (!context) return;

  try {
    const outcome = summarizeParserParse(result);
    void Promise.resolve()
      .then(() => sendParserParseCapture(context, outcome))
      .catch(() => undefined);
  } catch {
    // Telemetry must never affect parsing.
  }
}

export function captureParserParseException(context: ParserParseCaptureContext | undefined): void {
  if (!context) return;

  try {
    void Promise.resolve()
      .then(() => sendParserParseCapture(context, { outcome: "threw" }))
      .catch(() => undefined);
  } catch {
    // Telemetry must never affect parsing or replace the original thrown value.
  }
}
