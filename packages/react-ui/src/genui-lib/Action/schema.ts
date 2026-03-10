import { BuiltinActionType } from "@openuidev/react-lang";
import { z } from "zod";

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

export const actionSchema = z
  .union([openUrlAction, continueConversationAction, customAction])
  .optional();

export type ActionSchema = z.infer<typeof actionSchema>;
