import { z } from "zod/v4";
import { race } from "./race-data";

export const raceQuerySchema = z
  .object({
    view: z.enum(["fastest_laps", "lap_times"]),
    driver_numbers: z.array(z.number().int().positive()).max(4),
    lap_start: z.number().int().min(1).max(race.laps),
    lap_end: z.number().int().min(1).max(race.laps),
    limit: z.number().int().min(1).max(20),
  })
  .strict()
  .superRefine((args, ctx) => {
    if (args.lap_start > args.lap_end)
      ctx.addIssue({ code: "custom", message: "The start lap must be at or before the end lap." });
    if (new Set(args.driver_numbers).size !== args.driver_numbers.length)
      ctx.addIssue({ code: "custom", message: "Choose each driver only once." });
    if (args.view === "lap_times" && args.driver_numbers.length === 0)
      ctx.addIssue({
        code: "custom",
        message: "Choose one to four drivers for a lap-time comparison.",
      });
  });
