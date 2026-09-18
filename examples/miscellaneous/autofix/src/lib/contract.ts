import { z } from "zod/v4";

export const MAX_GENERATION_CHARS = 100_000;
export const MAX_CONTEXT_CHARS = 8_000;
export const MAX_CONTEXT_TURNS = 20;

export const conversationTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(MAX_GENERATION_CHARS),
});
export type ConversationTurn = z.infer<typeof conversationTurnSchema>;

export const chatInputSchema = z
  .object({
    messages: z.array(conversationTurnSchema).min(1).max(100),
    // fetchLLM sends the standard AG-UI run fields alongside messages.
    threadId: z.string().optional(),
    runId: z.string().optional(),
    tools: z.array(z.unknown()).optional(),
    context: z.array(z.unknown()).optional(),
  })
  .strict()
  .refine(({ messages }) => {
    const last = messages.at(-1);
    return (
      last?.role === "user" &&
      last.content.trim().length > 0 &&
      last.content.length <= MAX_CONTEXT_CHARS
    );
  }, "End the conversation with a user prompt of at most 8,000 characters.");

/** Keep whole recent turns within the Autofix context budget. */
export function recentContext(
  messages: ConversationTurn[],
): ConversationTurn[] {
  const recent: ConversationTurn[] = [];
  let chars = 0;
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (
      recent.length === MAX_CONTEXT_TURNS ||
      chars + message.content.length > MAX_CONTEXT_CHARS
    )
      break;
    recent.unshift(message);
    chars += message.content.length;
  }
  return recent;
}

export const inputSchema = z
  .object({
    generation: z
      .string()
      .max(MAX_GENERATION_CHARS)
      .refine(
        (value) => value.trim().length > 0,
        "Enter an OpenUI Lang program.",
      ),
    context: z
      .array(conversationTurnSchema)
      .max(MAX_CONTEXT_TURNS)
      .default([])
      .refine(
        (turns) =>
          turns.reduce((sum, turn) => sum + turn.content.length, 0) <=
          MAX_CONTEXT_CHARS,
        "Repair context must fit within 8,000 characters.",
      ),
  })
  .strict();

const fixErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  statementId: z.string().optional(),
  component: z.string().optional(),
  path: z.string().optional(),
});

export const completionSchema = z
  .object({
    choices: z
      .array(
        z.object({ message: z.object({ content: z.string().nullable() }) }),
      )
      .min(1),
    fix_summary: z.object({
      status: z.enum(["already_valid", "fixed", "fix_failed"]),
      fixed_errors: z.array(fixErrorSchema),
      unfixed_errors: z.array(fixErrorSchema),
    }),
    usage: z
      .object({
        prompt_tokens: z.number(),
        completion_tokens: z.number(),
        total_tokens: z.number(),
      })
      .optional(),
  })
  .refine(
    (value) =>
      value.fix_summary.status === "fix_failed"
        ? value.choices[0]?.message.content === null
        : Boolean(value.choices[0]?.message.content?.trim()),
    "Autofix returned inconsistent content and status.",
  );

export type AutofixInput = z.infer<typeof inputSchema>;
export type AutofixCompletion = z.infer<typeof completionSchema>;

export const reportSchema = z.object({
  generation: z.string().max(MAX_GENERATION_CHARS),
  output: z.string().nullable(),
  status: z.enum(["valid", "fixed", "already_valid", "fix_failed"]),
  fixedErrors: z.array(fixErrorSchema),
  remainingErrors: z.array(fixErrorSchema),
  usage: completionSchema.shape.usage,
});
export type RepairReport = z.infer<typeof reportSchema>;

export const chatEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("delta"), text: z.string() }),
  z.object({ type: z.literal("repairing") }),
  z.object({ type: z.literal("result"), report: reportSchema }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);
export type ChatEvent = z.infer<typeof chatEventSchema>;
