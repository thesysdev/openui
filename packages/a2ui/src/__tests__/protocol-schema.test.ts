import { describe, expect, it } from "vitest";
import {
  actionMessageSchema,
  agentCapabilitiesSchema,
  agentFunctionResponseMessageSchema,
  agentToRendererMessageSchema,
  callAgentFunctionMessageSchema,
  callRendererFunctionMessageSchema,
  genericErrorMessageSchema,
  rendererCapabilitiesSchema,
  rendererDataModelSchema,
  rendererToAgentMessageSchema,
  updateComponentsMessageSchema,
  validationFailedErrorMessageSchema,
} from "../protocol-schema";

describe("canonical A2UI protocol schemas", () => {
  it("validates OpenUI Lang component updates", () => {
    expect(
      updateComponentsMessageSchema.safeParse({
        version: "v1.0",
        updateComponents: {
          surfaceId: "main",
          components: ["root = Stack([title])", 'title = TextContent("Hello")'],
        },
      }).success,
    ).toBe(true);

    expect(
      updateComponentsMessageSchema.safeParse({
        version: "v1.0",
        updateComponents: { surfaceId: "main", components: [] },
      }).success,
    ).toBe(false);
    expect(
      updateComponentsMessageSchema.safeParse({
        version: "v1.0",
        updateComponents: { surfaceId: "main", components: [""] },
      }).success,
    ).toBe(false);
  });

  it("validates both protocol directions from the top-level schemas", () => {
    expect(
      agentToRendererMessageSchema.safeParse({
        version: "v1.0",
        callRendererFunction: {
          functionCallId: "call-1",
          callFunction: {
            call: "lookup",
            catalogId: "com.example:functions",
            args: { id: 42 },
          },
        },
      }).success,
    ).toBe(true);
    expect(
      callRendererFunctionMessageSchema.safeParse({
        version: "v1.0",
        callRendererFunction: {
          functionCallId: "call-1",
          callFunction: { call: "lookup" },
        },
      }).success,
    ).toBe(false);
    expect(
      agentFunctionResponseMessageSchema.safeParse({
        version: "v1.0",
        agentFunctionResponse: { functionCallId: "call-2", value: { ok: true } },
      }).success,
    ).toBe(true);
    expect(
      callAgentFunctionMessageSchema.safeParse({
        version: "v1.0",
        callAgentFunction: {
          surfaceId: "main",
          functionCallId: "call-2",
          callFunction: { call: "lookup", args: { id: 42 } },
        },
      }).success,
    ).toBe(true);

    const action = {
      version: "v1.0",
      action: {
        name: "submit",
        surfaceId: "main",
        sourceComponentId: "submit-button",
        timestamp: "2026-07-31T10:00:00.000Z",
        context: { intent: "save" },
      },
    };
    expect(actionMessageSchema.safeParse(action).success).toBe(true);
    expect(rendererToAgentMessageSchema.safeParse(action).success).toBe(true);
    expect(
      actionMessageSchema.safeParse({
        ...action,
        action: { ...action.action, timestamp: "2026-07-31T15:30:00+05:30" },
      }).success,
    ).toBe(true);
    expect(
      actionMessageSchema.safeParse({
        ...action,
        action: { ...action.action, timestamp: "not-a-timestamp" },
      }).success,
    ).toBe(false);
  });

  it("keeps validation failures distinct from generic protocol errors", () => {
    const validationFailure = {
      version: "v1.0",
      error: {
        code: "VALIDATION_FAILED",
        surfaceId: "main",
        path: "/updateComponents/components",
        message: "Required",
      },
    };
    expect(validationFailedErrorMessageSchema.safeParse(validationFailure).success).toBe(true);
    expect(
      validationFailedErrorMessageSchema.safeParse({
        ...validationFailure,
        error: { ...validationFailure.error, code: "UNALLOWED_CHILD" },
      }).success,
    ).toBe(true);
    expect(genericErrorMessageSchema.safeParse(validationFailure).success).toBe(false);
    expect(
      genericErrorMessageSchema.safeParse({
        version: "v1.0",
        error: { code: "FUNCTION_NOT_FOUND", functionCallId: "call-1", message: "Unknown" },
      }).success,
    ).toBe(true);
  });

  it("validates capabilities and renderer data-model metadata", () => {
    expect(
      rendererCapabilitiesSchema.safeParse({
        "v1.0": { supportedCatalogIds: ["com.example:openui"] },
      }).success,
    ).toBe(true);
    expect(
      agentCapabilitiesSchema.safeParse({ "v1.0": { acceptsInlineCatalogs: true } }).success,
    ).toBe(true);
    expect(
      rendererDataModelSchema.safeParse({
        version: "v1.0",
        surfaces: { main: { user: { name: "Alice" } } },
      }).success,
    ).toBe(true);
  });
});
