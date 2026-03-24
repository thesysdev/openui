import { BuiltinActionType } from "@openuidev/react-lang";
import { z } from "zod";

const continueConversationAction = z.object({
  type: z.literal(BuiltinActionType.ContinueConversation),
  context: z.string().optional(),
});

const openUrlAction = z.object({
  type: z.literal(BuiltinActionType.OpenUrl),
  url: z.string(),
});

export const actionSchema = z
  .union([openUrlAction, continueConversationAction])
  .optional();

export type ActionSchema = z.infer<typeof actionSchema>;
