import { BuiltinActionType } from "@openuidev/lang-react";
import { z } from "zod";

// Action schemas for Button component
const continueConversationAction = z.object({
  type: z.literal(BuiltinActionType.ContinueConversation),
  /** Extra context string passed to the LLM — useful for carousel/list item data. */
  context: z.string().optional(),
});

const openUrlAction = z.object({
  type: z.literal(BuiltinActionType.OpenUrl),
  url: z.string(),
});

const customAction = z.object({
  type: z.string(),
  params: z.record(z.string(), z.any()).optional(),
});

// Union: check specific types first, then custom fallback
export const actionSchema = z
  .union([openUrlAction, continueConversationAction, customAction])
  .optional();

export type ActionSchema = z.infer<typeof actionSchema>;

export const ButtonSchema = z.object({
  label: z.string(),
  action: actionSchema,
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  type: z.enum(["normal", "destructive"]).optional(),
  size: z.enum(["extra-small", "small", "medium", "large"]).optional(),
});
