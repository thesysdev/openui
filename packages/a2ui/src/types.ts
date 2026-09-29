import type {
  ActionEvent,
  LibraryJSONSchema,
  OpenUIError,
  ParseResult,
} from "@openuidev/lang-core";
import type { z } from "zod/v4";
import type {
  a2uiFunctionCallSchema,
  a2uiFunctionResponseSchema,
  actionMessageSchema,
  agentCapabilitiesSchema,
  agentFunctionResponseMessageSchema,
  agentToRendererMessageSchema,
  callAgentFunctionMessageSchema,
  callRendererFunctionMessageSchema,
  createSurfaceMessageSchema,
  deleteSurfaceMessageSchema,
  genericErrorMessageSchema,
  jsonObjectSchema,
  jsonValueSchema,
  messageMetadataSchema,
  rendererCapabilitiesSchema,
  rendererDataModelSchema,
  rendererFunctionResponseMessageSchema,
  rendererToAgentMessageSchema,
  updateComponentsMessageSchema,
  updateDataModelMessageSchema,
  validationFailedErrorMessageSchema,
} from "./protocol-schema";

export type JsonValue = z.infer<typeof jsonValueSchema>;
export type JsonPrimitive = Extract<JsonValue, string | number | boolean | null>;
export type JsonObject = z.infer<typeof jsonObjectSchema>;
export type A2UIFunctionCall = z.infer<typeof a2uiFunctionCallSchema>;
export type A2UIFunctionResponse = z.infer<typeof a2uiFunctionResponseSchema>;
export type A2UIMessageMetadata = z.infer<typeof messageMetadataSchema>;
export type CreateSurfaceMessage = z.infer<typeof createSurfaceMessageSchema>;
export type UpdateComponentsMessage = z.infer<typeof updateComponentsMessageSchema>;
export type UpdateDataModelMessage = z.infer<typeof updateDataModelMessageSchema>;
export type DeleteSurfaceMessage = z.infer<typeof deleteSurfaceMessageSchema>;
export type CallRendererFunctionMessage = z.infer<typeof callRendererFunctionMessageSchema>;
export type AgentFunctionResponseMessage = z.infer<typeof agentFunctionResponseMessageSchema>;
export type AgentToRendererMessage = z.infer<typeof agentToRendererMessageSchema>;
export type ActionMessage = z.infer<typeof actionMessageSchema>;
export type CallAgentFunctionMessage = z.infer<typeof callAgentFunctionMessageSchema>;
export type RendererFunctionResponseMessage = z.infer<typeof rendererFunctionResponseMessageSchema>;
export type ValidationFailedErrorMessage = z.infer<typeof validationFailedErrorMessageSchema>;
export type GenericErrorMessage = z.infer<typeof genericErrorMessageSchema>;
export type RendererToAgentMessage = z.infer<typeof rendererToAgentMessageSchema>;
export type RendererCapabilities = z.infer<typeof rendererCapabilitiesSchema>;
export type AgentCapabilities = z.infer<typeof agentCapabilitiesSchema>;
export type RendererDataModel = z.infer<typeof rendererDataModelSchema>;

export interface SurfaceSnapshot {
  surfaceId: string;
  catalogId?: string;
  metadata?: A2UIMessageMetadata;
  sendDataModel: boolean;
  source: string;
  dataModel: JsonObject;
  parseResult: ParseResult | null;
  errors: OpenUIError[];
  revision: number;
}

export type A2UIRendererFunction = (args: JsonObject) => JsonValue | Promise<JsonValue>;

export type A2UIFunctionAllowedCaller = "rendererOnly" | "agentOnly" | "rendererOrAgent";

export interface A2UIRendererFunctionRegistration {
  handler: A2UIRendererFunction;
  /** Catalog that defines this function. Required when the agent may call it. */
  catalogId?: string;
  /** Matches A2UI catalog allowedCallers semantics. Defaults to rendererOnly. */
  allowedCallers?: A2UIFunctionAllowedCaller;
}

export interface A2UIClientOptions {
  schema: LibraryJSONSchema;
  rootName?: string;
  functions?: Record<string, A2UIRendererFunction | A2UIRendererFunctionRegistration>;
  rendererCapabilities?: RendererCapabilities;
  onMessage?: (message: RendererToAgentMessage, metadata: RendererMetadata) => void;
  now?: () => Date;
  createId?: () => string;
}

export interface ProtocolValidationIssue {
  path: string;
  message: string;
}

export interface ProcessResult {
  ok: boolean;
  outbound: RendererToAgentMessage[];
  /** Present when malformed input cannot be represented as an A2UI error envelope. */
  issues?: ProtocolValidationIssue[];
}

export interface DispatchActionInput {
  surfaceId: string;
  sourceComponentId: string;
  name: string;
  userMessage?: string;
  context?: JsonObject;
  metadata?: A2UIMessageMetadata;
}

export interface CallAgentFunctionInput {
  surfaceId: string;
  call: string;
  catalogId?: string;
  args?: JsonObject;
}

export interface OpenUIActionOptions {
  name?: string;
  /** A2UI component ID to report for the action. Defaults to root. */
  sourceComponentId?: string;
  userMessage?: string;
  context?: JsonObject;
  metadata?: A2UIMessageMetadata;
}

export type MapOpenUIAction = (event: ActionEvent, surface: SurfaceSnapshot) => OpenUIActionOptions;

export interface RendererMetadata {
  a2uiRendererCapabilities?: RendererCapabilities;
  a2uiRendererDataModel?: RendererDataModel;
}
