import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { rulesSchema } from "../rules";

export const DatePickerSchema = z.object({
  name: z.string(),
  mode: z.enum(["single", "range"]).optional(),
  rules: rulesSchema,
  value: reactive(z.unknown().optional()),
});
