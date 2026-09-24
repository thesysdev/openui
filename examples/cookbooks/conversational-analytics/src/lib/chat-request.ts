import { z } from "zod/v4";
import { defaultFilters, filterSchema } from "./filters";
import { extractProgram } from "./openui-content";

const messageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(40000),
    filters: filterSchema.optional(),
  })
  .refine(
    (message) =>
      message.role !== "user" ||
      (message.content.trim().length > 0 && message.content.trim().length <= 600),
    "Enter a question of up to 600 characters.",
  );

export const chatRequestSchema = z
  .object({
    threadId: z.string().min(1).max(200),
    messages: z.array(messageSchema).min(1).max(12),
  })
  .refine((body) => body.messages.at(-1)?.role === "user", "The last message must be a question.");

export function cloudInput(body: z.infer<typeof chatRequestSchema>, countries: string[]) {
  const filters =
    [...body.messages].reverse().find((message) => message.role === "assistant" && message.filters)
      ?.filters ?? defaultFilters;
  if (!countries.includes(filters.country)) throw new RangeError("Unknown country.");
  return [
    {
      role: "developer" as const,
      content: `Current filters on the latest dashboard: ${JSON.stringify(filters)}. Preserve them unless the new question asks to change them.`,
    },
    ...body.messages.map((message) => ({
      role: message.role,
      content: message.role === "assistant" ? extractProgram(message.content) : message.content,
    })),
  ];
}
