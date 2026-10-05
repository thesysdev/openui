import {
  agentFunctionResponseMessageSchema,
  agentToRendererMessageSchema,
  callRendererFunctionMessageSchema,
  createSurfaceMessageSchema,
  deleteSurfaceMessageSchema,
  updateComponentsMessageSchema,
  updateDataModelMessageSchema,
} from "./protocol-schema";
import type { AgentToRendererMessage, ProtocolValidationIssue } from "./types";

function escapePointerToken(token: PropertyKey): string {
  return String(token).replace(/~/g, "~0").replace(/\//g, "~1");
}

function issuePath(path: PropertyKey[]): string {
  return path.length === 0 ? "/" : `/${path.map(escapePointerToken).join("/")}`;
}

export function validateAgentToRendererMessage(
  input: unknown,
):
  | { success: true; message: AgentToRendererMessage }
  | { success: false; issues: ProtocolValidationIssue[] } {
  const object =
    input != null && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : undefined;
  const messageKeys = [
    "createSurface",
    "updateComponents",
    "updateDataModel",
    "deleteSurface",
    "callRendererFunction",
    "agentFunctionResponse",
  ] as const;
  const presentKeys = object
    ? messageKeys.filter((key) => Object.prototype.hasOwnProperty.call(object, key))
    : [];
  const selectedSchema =
    presentKeys.length === 1
      ? {
          createSurface: createSurfaceMessageSchema,
          updateComponents: updateComponentsMessageSchema,
          updateDataModel: updateDataModelMessageSchema,
          deleteSurface: deleteSurfaceMessageSchema,
          callRendererFunction: callRendererFunctionMessageSchema,
          agentFunctionResponse: agentFunctionResponseMessageSchema,
        }[presentKeys[0]!]
      : agentToRendererMessageSchema;
  const result = selectedSchema.safeParse(input);
  if (result.success) {
    return { success: true, message: result.data as AgentToRendererMessage };
  }
  return {
    success: false,
    issues: result.error.issues.map((issue) => ({
      path: issuePath(issue.path),
      message: issue.message,
    })),
  };
}
