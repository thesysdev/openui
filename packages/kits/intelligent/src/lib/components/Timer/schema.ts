import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const TimerSchema = z.object({
  seconds: reactive(z.number()),
  label: z.string().optional(),
});

export type TimerProps = z.infer<typeof TimerSchema>;
