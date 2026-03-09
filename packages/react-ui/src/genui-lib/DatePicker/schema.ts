import { z } from "zod";
import { rulesSchema } from "../rules";

export const DatePickerSchema = z.object({
  name: z.string(),
  mode: z.enum(["single", "range"]),
  rules: rulesSchema,
});
