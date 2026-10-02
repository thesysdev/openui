import { ScriptLoop } from "./script-loop";
import {
  DashboardToolError,
  type ChatCompletionFunctionTool,
  type ContextArg,
  type CreateDashboardToolsOptions,
  type DashboardArtifactRef,
  type DashboardGenerationTool,
  type DashboardQueryRequest,
  type DashboardRunResult,
  type DashboardToolDef,
  type DashboardToolParameters,
  type ResponsesFunctionTool,
} from "./types";
import { isRecord, runFailure, runSuccess } from "./util";

export interface DashboardTools<Ctx = undefined> {
  /** Answers one renderer Query or Mutation request. */
  runTools: (
    request: DashboardQueryRequest,
    ...context: ContextArg<Ctx>
  ) => Promise<DashboardRunResult>;
  /** Flat Responses API tools for the main chat loop. */
  responsesTools: ResponsesFunctionTool[];
  /** Chat Completions tools for providers using that API shape. */
  chatCompletionTools: ChatCompletionFunctionTool[];
  /** Serializable tool definitions consumed by `artifactTool` during generation. */
  generationTools: DashboardGenerationTool[];
}

/**
 * Shallow structural validation only. `execute` must still treat arguments as
 * untrusted input and enforce any domain-specific constraints.
 */
function validateToolArgs(
  schema: DashboardToolParameters | null | undefined,
  args: Record<string, unknown>,
): string | null {
  if (!schema) return null;

  for (const key of schema.required ?? []) {
    if (!(key in args) || args[key] === null || args[key] === undefined) {
      return `missing required argument "${key}"`;
    }
  }

  for (const [key, value] of Object.entries(args)) {
    const property = schema.properties?.[key];
    if (!property?.type || value === null || value === undefined) continue;

    const actual = Array.isArray(value) ? "array" : typeof value;
    if (property.type === "integer") {
      if (!Number.isInteger(value)) {
        return `argument "${key}" must be integer, got ${actual === "number" ? String(value) : actual}`;
      }
      continue;
    }
    if (property.type !== actual) {
      return `argument "${key}" must be ${property.type}, got ${actual}`;
    }
  }

  return null;
}

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

const toArtifactRef = (value: unknown): DashboardArtifactRef | undefined => {
  if (!isRecord(value) || typeof value.id !== "string" || value.id === "") return undefined;
  return {
    id: value.id,
    ...(typeof value.version === "string" && { version: value.version }),
  };
};

/**
 * Builds the dashboard data-plane helper. The host route owns authentication
 * and passes its trusted context separately from the renderer request body.
 */
export function createDashboardTools<Ctx = undefined>(
  options: CreateDashboardToolsOptions<Ctx>,
): DashboardTools<Ctx> {
  const byName = new Map<string, DashboardToolDef<Ctx>>();
  for (const tool of options.tools) {
    if (tool.type !== "function") {
      throw new Error(
        `createDashboardTools: tool "${tool?.name ?? "?"}" must have type "function" (flat Responses tool shape)`,
      );
    }
    if (typeof tool.name !== "string" || !IDENTIFIER_RE.test(tool.name)) {
      throw new Error(
        `createDashboardTools: tool name ${JSON.stringify(tool.name)} must be a valid identifier ([A-Za-z_][A-Za-z0-9_]*) — scripts call it as tools.<name>(...)`,
      );
    }
    if (typeof tool.execute !== "function") {
      throw new Error(`createDashboardTools: tool "${tool.name}" needs an execute function`);
    }
    if (byName.has(tool.name)) {
      throw new Error(`createDashboardTools: duplicate tool "${tool.name}"`);
    }
    byName.set(tool.name, tool);
  }

  const scriptLoop = new ScriptLoop(options.scripts);

  const dispatch = async (
    name: string,
    args: Record<string, unknown>,
    context: Ctx,
  ): Promise<unknown> => {
    const tool = byName.get(name);
    if (!tool) {
      throw new DashboardToolError(
        "TOOL_NOT_FOUND",
        `unknown tool "${name}". Available: ${[...byName.keys()].join(", ")}`,
        404,
      );
    }

    const argsError = validateToolArgs(tool.parameters, args);
    if (argsError) throw new DashboardToolError("BAD_ARGS", `${name}: ${argsError}`, 400);

    try {
      return await tool.execute(args, context);
    } catch (error) {
      if (error instanceof DashboardToolError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new DashboardToolError("TOOL_EXEC_ERROR", `${name}: ${message}`, 502);
    }
  };

  const runTools = async (
    request: DashboardQueryRequest,
    ...contextArg: ContextArg<Ctx>
  ): Promise<DashboardRunResult> => {
    const raw: Record<string, unknown> = isRecord(request)
      ? (request as Record<string, unknown>)
      : {};
    const name = raw.name;
    if (typeof name !== "string" || name === "") {
      return runFailure("BAD_REQUEST", "`name` (string) is required", 400);
    }
    if (raw.arguments !== undefined && !isRecord(raw.arguments)) {
      return runFailure("BAD_REQUEST", "`arguments` must be an object", 400);
    }

    const args = isRecord(raw.arguments) ? raw.arguments : {};
    const context = contextArg[0] as Ctx;

    if (!byName.has(name)) {
      const artifact = toArtifactRef(raw.artifact);
      if (artifact && scriptLoop.enabled) {
        return scriptLoop.run({
          artifact,
          name,
          args,
          runLocalTool: (toolName, toolArgs) => dispatch(toolName, toolArgs, context),
        });
      }
      if (artifact && !scriptLoop.enabled) {
        return runFailure(
          "SCRIPTS_NOT_CONFIGURED",
          `"${name}" is not a local tool and script execution is not configured — set THESYS_API_KEY (or scripts.apiKey) on createDashboardTools`,
          501,
        );
      }
    }

    try {
      return runSuccess(await dispatch(name, args, context));
    } catch (error) {
      if (error instanceof DashboardToolError) {
        return runFailure(error.code, error.message, error.status);
      }
      const message = error instanceof Error ? error.message : String(error);
      return runFailure("TOOL_EXEC_ERROR", `${name}: ${message}`, 502);
    }
  };

  const responsesTools: ResponsesFunctionTool[] = [...byName.values()].map(
    ({ type, name, description, parameters, strict }) => ({
      type,
      name,
      ...(description !== undefined && { description }),
      parameters: parameters ?? null,
      strict: strict ?? null,
    }),
  );

  const chatCompletionTools: ChatCompletionFunctionTool[] = [...byName.values()].map(
    ({ name, description, parameters, strict }) => ({
      type: "function",
      function: {
        name,
        ...(description !== undefined && { description }),
        ...(parameters !== undefined && { parameters }),
        ...(strict !== undefined && { strict }),
      },
    }),
  );

  const generationTools: DashboardGenerationTool[] = [...byName.values()].map(
    ({ type, name, description, parameters, strict, sample }) => ({
      type,
      name,
      ...(description !== undefined && { description }),
      ...(parameters !== undefined && { parameters }),
      ...(strict !== undefined && { strict }),
      ...(sample !== undefined && { sample }),
    }),
  );

  return { runTools, responsesTools, chatCompletionTools, generationTools };
}
