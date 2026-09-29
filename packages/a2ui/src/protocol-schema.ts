import { z } from "zod/v4";

export const jsonValueSchema = z.json();
export const jsonObjectSchema = z.record(z.string(), jsonValueSchema);

const versionSchema = z.literal("v1.0");
const surfaceIdSchema = z.string();
const extensionKeySchema = z.string().regex(/^[\p{XID_Start}_][\p{XID_Continue}]*$/u);
const extensionsSchema = z.record(extensionKeySchema, jsonValueSchema);
export const messageMetadataSchema = z.strictObject({ extensions: extensionsSchema.optional() });
const langComponentsSchema = z
  .array(z.string().min(1))
  .min(1)
  .describe(
    "Complete OpenUI Lang statements or statement blocks, merged by statement ID in array order.",
  );

export const a2uiFunctionCallSchema = z.strictObject({
  call: z.string(),
  catalogId: z.string().optional(),
  args: jsonObjectSchema.optional(),
});

export const a2uiFunctionResponseSchema = z.union([
  z.strictObject({ functionCallId: z.string(), value: jsonValueSchema }),
  z.strictObject({
    functionCallId: z.string(),
    error: z.strictObject({ code: z.string(), message: z.string() }),
  }),
]);

export const createSurfaceMessageSchema = z.strictObject({
  version: versionSchema,
  createSurface: z.strictObject({
    surfaceId: surfaceIdSchema,
    catalogId: z.string().optional(),
    sendDataModel: z.boolean().optional().meta({ default: false }),
    components: langComponentsSchema
      .optional()
      .describe("Optional initial OpenUI Lang statements for single-message surface creation."),
    dataModel: jsonObjectSchema.optional(),
    metadata: messageMetadataSchema.optional(),
  }),
});

export const updateComponentsMessageSchema = z.strictObject({
  version: versionSchema,
  updateComponents: z.strictObject({
    surfaceId: surfaceIdSchema,
    components: langComponentsSchema,
  }),
});

export const updateDataModelMessageSchema = z.strictObject({
  version: versionSchema,
  updateDataModel: z.strictObject({
    surfaceId: surfaceIdSchema,
    path: z.string().optional(),
    value: jsonValueSchema,
  }),
});

export const deleteSurfaceMessageSchema = z.strictObject({
  version: versionSchema,
  deleteSurface: z.strictObject({ surfaceId: surfaceIdSchema }),
});

export const callRendererFunctionMessageSchema = z.strictObject({
  version: versionSchema,
  callRendererFunction: z.strictObject({
    functionCallId: z.string(),
    callFunction: a2uiFunctionCallSchema.extend({ catalogId: z.string() }),
  }),
});

export const agentFunctionResponseMessageSchema = z.strictObject({
  version: versionSchema,
  agentFunctionResponse: a2uiFunctionResponseSchema,
});

export const agentToRendererMessageSchema = z.union([
  createSurfaceMessageSchema,
  updateComponentsMessageSchema,
  updateDataModelMessageSchema,
  deleteSurfaceMessageSchema,
  callRendererFunctionMessageSchema,
  agentFunctionResponseMessageSchema,
]);

export const actionMessageSchema = z.strictObject({
  version: versionSchema,
  action: z.strictObject({
    name: z.string(),
    userMessage: z.string().optional(),
    surfaceId: surfaceIdSchema,
    sourceComponentId: z.string(),
    timestamp: z.iso.datetime({ offset: true }),
    context: jsonObjectSchema,
    metadata: messageMetadataSchema.optional(),
  }),
});

export const callAgentFunctionMessageSchema = z.strictObject({
  version: versionSchema,
  callAgentFunction: z.strictObject({
    surfaceId: surfaceIdSchema,
    functionCallId: z.string(),
    callFunction: a2uiFunctionCallSchema,
  }),
});

export const rendererFunctionResponseMessageSchema = z.strictObject({
  version: versionSchema,
  rendererFunctionResponse: a2uiFunctionResponseSchema,
});

const validationErrorCodeSchema = z.enum([
  "VALIDATION_FAILED",
  "UNALLOWED_PARENT",
  "UNALLOWED_CHILD",
]);

export const validationFailedErrorMessageSchema = z.strictObject({
  version: versionSchema,
  error: z.strictObject({
    code: validationErrorCodeSchema,
    surfaceId: surfaceIdSchema,
    path: z.string(),
    message: z.string(),
  }),
});

const genericErrorCodeSchema = z
  .string()
  .refine((code) => !validationErrorCodeSchema.options.includes(code as never));

export const genericErrorMessageSchema = z.union([
  z.strictObject({
    version: versionSchema,
    error: z.strictObject({
      code: genericErrorCodeSchema,
      message: z.string(),
      surfaceId: surfaceIdSchema,
    }),
  }),
  z.strictObject({
    version: versionSchema,
    error: z.strictObject({
      code: genericErrorCodeSchema,
      message: z.string(),
      functionCallId: z.string(),
    }),
  }),
]);

export const rendererToAgentMessageSchema = z.union([
  actionMessageSchema,
  callAgentFunctionMessageSchema,
  rendererFunctionResponseMessageSchema,
  validationFailedErrorMessageSchema,
  genericErrorMessageSchema,
]);

export const rendererCapabilitiesSchema = z.strictObject({
  "v1.0": z.strictObject({
    supportedCatalogIds: z.array(z.string()),
    inlineCatalogs: z.array(jsonObjectSchema).optional(),
  }),
});

export const agentCapabilitiesSchema = z.strictObject({
  "v1.0": z.strictObject({
    supportedCatalogIds: z.array(z.string()).optional(),
    acceptsInlineCatalogs: z.boolean().optional().meta({ default: false }),
  }),
});

export const rendererDataModelSchema = z.strictObject({
  version: versionSchema,
  surfaces: z.record(z.string(), jsonObjectSchema),
});
