import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { rulesSchema } from "../rules";

export const TextAreaSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  rows: z.number().optional(),
  rules: rulesSchema,
  value: reactive(z.string().optional()),
});
