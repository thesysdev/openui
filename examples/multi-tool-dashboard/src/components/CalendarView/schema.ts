import { z } from "zod";

export const CalendarViewSchema = z.object({
  events: z
    .array(
      z.object({
        summary: z.string().optional(),
        start: z.any().optional(),
        status: z.string().optional(),
      }),
    )
    .describe("Array of calendar event objects with summary, start (dateTime or date), and status"),
  title: z.string().optional().describe("Optional header title shown above the calendar"),
});
