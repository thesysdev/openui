import {
  createParser,
  type ActionEvent,
  type OpenUIError,
  type Parser,
  type ValidationError,
} from "@openuidev/lang-core";
import { applyDataModelUpdate, mergeOpenUIStateIntoDataModel, toJsonObject } from "./json-pointer";
import { validateAgentToRendererMessage } from "./runtime-schema";
import { mergeComponentStatements } from "./statement-patch";
import type {
  A2UIClientOptions,
  ActionMessage,
  AgentFunctionResponseMessage,
  AgentToRendererMessage,
  CallAgentFunctionInput,
  DispatchActionInput,
  GenericErrorMessage,
  JsonObject,
  JsonValue,
  OpenUIActionOptions,
  ProcessResult,
  ProtocolValidationIssue,
  RendererDataModel,
  RendererMetadata,
  RendererToAgentMessage,
  SurfaceSnapshot,
  ValidationFailedErrorMessage,
} from "./types";

type SurfaceListener = () => void;
type MessageListener = (message: RendererToAgentMessage, metadata: RendererMetadata) => void;

interface PendingAgentFunction {
  surfaceId: string;
  resolve: (value: JsonValue) => void;
  reject: (error: Error) => void;
}

export class A2UIFunctionError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "A2UIFunctionError";
    this.code = code;
  }
}

function defaultId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `a2ui-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function parseError(error: ValidationError): OpenUIError {
  return {
    source: "parser",
    code: error.code,
    message: error.message,
    statementId: error.statementId,
    component: error.component,
    path: error.path,
  };
}

function isCreateSurface(
  message: AgentToRendererMessage,
): message is Extract<AgentToRendererMessage, { createSurface: unknown }> {
  return "createSurface" in message;
}

function isUpdateComponents(
  message: AgentToRendererMessage,
): message is Extract<AgentToRendererMessage, { updateComponents: unknown }> {
  return "updateComponents" in message;
}

function isUpdateDataModel(
  message: AgentToRendererMessage,
): message is Extract<AgentToRendererMessage, { updateDataModel: unknown }> {
  return "updateDataModel" in message;
}

function isDeleteSurface(
  message: AgentToRendererMessage,
): message is Extract<AgentToRendererMessage, { deleteSurface: unknown }> {
  return "deleteSurface" in message;
}

function isCallRendererFunction(
  message: AgentToRendererMessage,
): message is Extract<AgentToRendererMessage, { callRendererFunction: unknown }> {
  return "callRendererFunction" in message;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function validationTarget(input: unknown): {
  surfaceId?: string;
  functionCallId?: string;
} {
  const message = record(input);
  if (!message) return {};
  for (const key of ["createSurface", "updateComponents", "updateDataModel", "deleteSurface"]) {
    const payload = record(message[key]);
    if (typeof payload?.surfaceId === "string") {
      return { surfaceId: payload.surfaceId };
    }
  }
  for (const key of ["callRendererFunction", "agentFunctionResponse"]) {
    const payload = record(message[key]);
    if (typeof payload?.functionCallId === "string") {
      return { functionCallId: payload.functionCallId };
    }
  }
  return {};
}

export class A2UIClient {
  readonly #parser: Parser;
  readonly #functions: A2UIClientOptions["functions"];
  readonly #onMessage?: A2UIClientOptions["onMessage"];
  readonly #rendererCapabilities?: A2UIClientOptions["rendererCapabilities"];
  readonly #now: () => Date;
  readonly #createId: () => string;
  readonly #surfaces = new Map<string, SurfaceSnapshot>();
  readonly #surfaceListeners = new Set<SurfaceListener>();
  readonly #messageListeners = new Set<MessageListener>();
  readonly #pendingAgentFunctions = new Map<string, PendingAgentFunction>();
  #revision = 0;

  constructor(options: A2UIClientOptions) {
    this.#parser = createParser(options.schema, options.rootName);
    this.#functions = options.functions;
    this.#onMessage = options.onMessage;
    this.#rendererCapabilities = options.rendererCapabilities;
    this.#now = options.now ?? (() => new Date());
    this.#createId = options.createId ?? defaultId;
  }

  subscribe(listener: SurfaceListener): () => void {
    this.#surfaceListeners.add(listener);
    return () => this.#surfaceListeners.delete(listener);
  }

  subscribeMessages(listener: MessageListener): () => void {
    this.#messageListeners.add(listener);
    return () => this.#messageListeners.delete(listener);
  }

  getSurface(surfaceId: string): SurfaceSnapshot | undefined {
    return this.#surfaces.get(surfaceId);
  }

  getSurfaces(): SurfaceSnapshot[] {
    return [...this.#surfaces.values()];
  }

  getRendererDataModel(): RendererDataModel | undefined {
    const surfaces = Object.fromEntries(
      [...this.#surfaces]
        .filter(([, surface]) => surface.sendDataModel)
        .map(([surfaceId, surface]) => [surfaceId, structuredClone(surface.dataModel)]),
    );
    if (Object.keys(surfaces).length === 0) return undefined;
    return {
      version: "v1.0",
      surfaces,
    };
  }

  getRendererMetadata(): RendererMetadata {
    const dataModel = this.getRendererDataModel();
    return {
      ...(this.#rendererCapabilities
        ? { a2uiRendererCapabilities: structuredClone(this.#rendererCapabilities) }
        : {}),
      ...(dataModel ? { a2uiRendererDataModel: dataModel } : {}),
    };
  }

  async process(input: unknown): Promise<ProcessResult> {
    const outbound: RendererToAgentMessage[] = [];
    const capture = (next: RendererToAgentMessage) => outbound.push(next);
    this.#messageListeners.add(capture);
    try {
      const validated = validateAgentToRendererMessage(input);
      if (!validated.success) return this.#invalidMessage(input, validated.issues, outbound);
      const message = validated.message;

      if (isCreateSurface(message)) return this.#createSurface(message, outbound);
      if (isUpdateComponents(message)) return this.#updateComponents(message, outbound);
      if (isUpdateDataModel(message)) return this.#updateDataModel(message, outbound);
      if (isDeleteSurface(message)) return this.#deleteSurface(message, outbound);
      if (isCallRendererFunction(message)) {
        return await this.#callRendererFunction(message, outbound);
      }
      return this.#agentFunctionResponse(message, outbound);
    } finally {
      this.#messageListeners.delete(capture);
    }
  }

  updateSurfaceFromOpenUIState(surfaceId: string, state: Record<string, unknown>): boolean {
    const surface = this.#surfaces.get(surfaceId);
    if (!surface) return false;
    const dataModel = mergeOpenUIStateIntoDataModel(surface.dataModel, state);
    if (JSON.stringify(dataModel) === JSON.stringify(surface.dataModel)) return false;
    this.#replaceSurface({
      ...surface,
      dataModel,
    });
    return true;
  }

  dispatchOpenUIAction(
    surfaceId: string,
    event: ActionEvent,
    options: OpenUIActionOptions = {},
  ): void {
    const eventSourceComponentId = (event as ActionEvent & { sourceComponentId?: unknown })
      .sourceComponentId;
    const context: JsonObject = {
      ...toJsonObject(event.params),
      ...(event.formState ? { formState: toJsonObject(event.formState) } : {}),
      ...options.context,
    };
    this.dispatchAction({
      surfaceId,
      sourceComponentId:
        options.sourceComponentId ??
        (typeof eventSourceComponentId === "string" ? eventSourceComponentId : "root"),
      name: options.name ?? event.type,
      userMessage: (options.userMessage ?? event.humanFriendlyMessage) || undefined,
      context,
      metadata: options.metadata,
    });
  }

  dispatchAction(input: DispatchActionInput): void {
    if (!this.#surfaces.has(input.surfaceId)) {
      this.#emitGenericError(
        "SURFACE_NOT_FOUND",
        `Unknown surface: ${input.surfaceId}`,
        input.surfaceId,
      );
      return;
    }

    const message: ActionMessage = {
      version: "v1.0",
      action: {
        name: input.name,
        ...(input.userMessage ? { userMessage: input.userMessage } : {}),
        surfaceId: input.surfaceId,
        sourceComponentId: input.sourceComponentId,
        timestamp: this.#now().toISOString(),
        context: input.context ?? {},
        ...(input.metadata ? { metadata: input.metadata } : {}),
      },
    };
    this.#emit(message);
  }

  callAgentFunction(input: CallAgentFunctionInput): Promise<JsonValue> {
    if (!this.#surfaces.has(input.surfaceId)) {
      const message = `Unknown surface: ${input.surfaceId}`;
      this.#emitGenericError("SURFACE_NOT_FOUND", message, input.surfaceId);
      return Promise.reject(new A2UIFunctionError("SURFACE_NOT_FOUND", message));
    }

    const functionCallId = this.#createId();
    return new Promise<JsonValue>((resolve, reject) => {
      this.#pendingAgentFunctions.set(functionCallId, {
        surfaceId: input.surfaceId,
        resolve,
        reject,
      });
      this.#emit({
        version: "v1.0",
        callAgentFunction: {
          surfaceId: input.surfaceId,
          functionCallId,
          callFunction: {
            call: input.call,
            ...(input.catalogId ? { catalogId: input.catalogId } : {}),
            ...(input.args ? { args: input.args } : {}),
          },
        },
      });
    });
  }

  dispose(): void {
    for (const pending of this.#pendingAgentFunctions.values()) {
      pending.reject(new A2UIFunctionError("CLIENT_DISPOSED", "A2UI client was disposed"));
    }
    this.#pendingAgentFunctions.clear();
    this.#surfaces.clear();
    this.#surfaceListeners.clear();
    this.#messageListeners.clear();
  }

  #createSurface(
    message: Extract<AgentToRendererMessage, { createSurface: unknown }>,
    outbound: RendererToAgentMessage[],
  ): ProcessResult {
    const input = message.createSurface;
    if (this.#surfaces.has(input.surfaceId)) {
      this.#emitGenericError(
        "SURFACE_ALREADY_EXISTS",
        `Surface already exists: ${input.surfaceId}`,
        input.surfaceId,
      );
      return { ok: false, outbound };
    }
    const supportedCatalogIds = this.#rendererCapabilities?.["v1.0"].supportedCatalogIds ?? [];
    if (
      input.catalogId &&
      supportedCatalogIds.length > 0 &&
      !supportedCatalogIds.includes(input.catalogId)
    ) {
      this.#emitGenericError(
        "UNSUPPORTED_CATALOG",
        `Renderer does not support catalog: ${input.catalogId}`,
        input.surfaceId,
      );
      return { ok: false, outbound };
    }

    let source = "";
    let parseResult: SurfaceSnapshot["parseResult"] = null;
    let errors: OpenUIError[] = [];
    if (input.components) {
      try {
        ({ source, parseResult, errors } = this.#mergeComponents("", input.components));
      } catch (error) {
        this.#emitValidationError(
          input.surfaceId,
          "/createSurface/components",
          error instanceof Error ? error.message : String(error),
        );
        return { ok: false, outbound };
      }
    }
    this.#replaceSurface({
      surfaceId: input.surfaceId,
      catalogId: input.catalogId,
      metadata: input.metadata,
      sendDataModel: input.sendDataModel ?? false,
      source,
      dataModel: structuredClone(input.dataModel ?? {}),
      parseResult,
      errors,
      revision: 0,
    });
    for (const error of errors) {
      this.#emitValidationError(
        input.surfaceId,
        "/createSurface/components",
        error.statementId ? `${error.statementId}: ${error.message}` : error.message,
      );
    }
    return { ok: errors.length === 0, outbound };
  }

  #updateComponents(
    message: Extract<AgentToRendererMessage, { updateComponents: unknown }>,
    outbound: RendererToAgentMessage[],
  ): ProcessResult {
    const input = message.updateComponents;
    const surface = this.#requireSurface(input.surfaceId);
    if (!surface) return { ok: false, outbound };
    try {
      const { source, parseResult, errors } = this.#mergeComponents(
        surface.source,
        input.components,
      );
      this.#replaceSurface({ ...surface, source, parseResult, errors });
      for (const error of errors) {
        this.#emitValidationError(
          input.surfaceId,
          "/updateComponents/components",
          error.statementId ? `${error.statementId}: ${error.message}` : error.message,
        );
      }
      return { ok: errors.length === 0, outbound };
    } catch (error) {
      this.#emitValidationError(
        input.surfaceId,
        "/updateComponents/components",
        error instanceof Error ? error.message : String(error),
      );
      return { ok: false, outbound };
    }
  }

  #updateDataModel(
    message: Extract<AgentToRendererMessage, { updateDataModel: unknown }>,
    outbound: RendererToAgentMessage[],
  ): ProcessResult {
    const input = message.updateDataModel;
    const surface = this.#requireSurface(input.surfaceId);
    if (!surface) return { ok: false, outbound };
    try {
      const dataModel = applyDataModelUpdate(surface.dataModel, input.path, input.value);
      this.#replaceSurface({ ...surface, dataModel });
      return { ok: true, outbound };
    } catch (error) {
      this.#emitValidationError(
        input.surfaceId,
        "/updateDataModel/path",
        error instanceof Error ? error.message : String(error),
      );
      return { ok: false, outbound };
    }
  }

  #deleteSurface(
    message: Extract<AgentToRendererMessage, { deleteSurface: unknown }>,
    outbound: RendererToAgentMessage[],
  ): ProcessResult {
    const surfaceId = message.deleteSurface.surfaceId;
    if (!this.#requireSurface(surfaceId)) return { ok: false, outbound };
    this.#surfaces.delete(surfaceId);
    for (const [functionCallId, pending] of this.#pendingAgentFunctions) {
      if (pending.surfaceId === surfaceId) {
        pending.reject(
          new A2UIFunctionError("SURFACE_DELETED", `Surface was deleted: ${surfaceId}`),
        );
        this.#pendingAgentFunctions.delete(functionCallId);
      }
    }
    this.#notify();
    return { ok: true, outbound };
  }

  async #callRendererFunction(
    message: Extract<AgentToRendererMessage, { callRendererFunction: unknown }>,
    outbound: RendererToAgentMessage[],
  ): Promise<ProcessResult> {
    const { functionCallId, callFunction } = message.callRendererFunction;
    const { call, catalogId, args = {} } = callFunction;
    const registration = this.#functions?.[call];
    if (!registration) {
      this.#emitGenericError(
        "INVALID_FUNCTION_CALL",
        `Renderer function is not registered: ${call}`,
        undefined,
        functionCallId,
      );
      return { ok: false, outbound };
    }
    const fn = typeof registration === "function" ? registration : registration.handler;
    if (
      typeof registration === "function" ||
      (registration.allowedCallers ?? "rendererOnly") === "rendererOnly" ||
      registration.catalogId !== catalogId
    ) {
      this.#emitGenericError(
        "INVALID_FUNCTION_CALL",
        `Renderer function is not callable from catalog ${catalogId}: ${call}`,
        undefined,
        functionCallId,
      );
      return { ok: false, outbound };
    }
    try {
      const value = await fn(args);
      this.#emit({
        version: "v1.0",
        rendererFunctionResponse: { functionCallId, value },
      });
      return { ok: true, outbound };
    } catch (error) {
      this.#emit({
        version: "v1.0",
        rendererFunctionResponse: {
          functionCallId,
          error: {
            code: "EXECUTION_FAILED",
            message: error instanceof Error ? error.message : String(error),
          },
        },
      });
      return { ok: false, outbound };
    }
  }

  #agentFunctionResponse(
    message: AgentFunctionResponseMessage,
    outbound: RendererToAgentMessage[],
  ): ProcessResult {
    const response = message.agentFunctionResponse;
    const pending = this.#pendingAgentFunctions.get(response.functionCallId);
    if (!pending) {
      return {
        ok: false,
        outbound,
        issues: [
          {
            path: "/agentFunctionResponse/functionCallId",
            message: `Unknown functionCallId: ${response.functionCallId}`,
          },
        ],
      };
    }
    this.#pendingAgentFunctions.delete(response.functionCallId);
    if ("error" in response) {
      pending.reject(new A2UIFunctionError(response.error.code, response.error.message));
      return { ok: true, outbound };
    }
    pending.resolve(response.value);
    return { ok: true, outbound };
  }

  #replaceSurface(surface: Omit<SurfaceSnapshot, "revision"> & { revision?: number }): void {
    this.#revision += 1;
    this.#surfaces.set(surface.surfaceId, { ...surface, revision: this.#revision });
    this.#notify();
  }

  #mergeComponents(
    existing: string,
    components: string[],
  ): Pick<SurfaceSnapshot, "source" | "parseResult" | "errors"> {
    const source = mergeComponentStatements(existing, components);
    const parseResult = this.#parser.parse(source);
    return {
      source,
      parseResult,
      errors: parseResult.meta.errors.map(parseError),
    };
  }

  #invalidMessage(
    input: unknown,
    issues: ProtocolValidationIssue[],
    outbound: RendererToAgentMessage[],
  ): ProcessResult {
    const target = validationTarget(input);
    const issue = issues[0] ?? { path: "/", message: "Invalid A2UI message" };
    if (target.surfaceId !== undefined) {
      this.#emitValidationError(target.surfaceId, issue.path, issue.message);
      return { ok: false, outbound, issues };
    }
    if (target.functionCallId !== undefined) {
      this.#emitGenericError(
        "INVALID_MESSAGE",
        `${issue.path}: ${issue.message}`,
        undefined,
        target.functionCallId,
      );
      return { ok: false, outbound, issues };
    }
    return { ok: false, outbound, issues };
  }

  #requireSurface(surfaceId: string): SurfaceSnapshot | undefined {
    const surface = this.#surfaces.get(surfaceId);
    if (!surface) {
      this.#emitGenericError("SURFACE_NOT_FOUND", `Unknown surface: ${surfaceId}`, surfaceId);
    }
    return surface;
  }

  #emitValidationError(surfaceId: string, path: string, message: string): void {
    const error: ValidationFailedErrorMessage = {
      version: "v1.0",
      error: { code: "VALIDATION_FAILED", surfaceId, path, message },
    };
    this.#emit(error);
  }

  #emitGenericError(
    code: string,
    message: string,
    surfaceId?: string,
    functionCallId?: string,
  ): void {
    if (surfaceId === undefined && functionCallId === undefined) return;
    const error: GenericErrorMessage =
      surfaceId !== undefined
        ? { version: "v1.0", error: { code, message, surfaceId } }
        : { version: "v1.0", error: { code, message, functionCallId: functionCallId! } };
    this.#emit(error);
  }

  #emit(message: RendererToAgentMessage): void {
    const metadata = this.getRendererMetadata();
    this.#onMessage?.(message, metadata);
    for (const listener of this.#messageListeners) listener(message, metadata);
  }

  #notify(): void {
    for (const listener of this.#surfaceListeners) listener();
  }
}

export function createA2UIClient(options: A2UIClientOptions): A2UIClient {
  return new A2UIClient(options);
}
