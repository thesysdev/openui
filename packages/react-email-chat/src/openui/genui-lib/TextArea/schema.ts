import { z } from "zod";
import { rulesSchema } from "../rules";

export const TextAreaSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  rows: z.number().optional(),
  rules: rulesSchema,
});
