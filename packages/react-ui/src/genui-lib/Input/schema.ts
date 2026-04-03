import { reactive } from "@openuidev/react-lang";
import { z } from "zod";
import { rulesSchema } from "../rules";

export const InputSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  type: z.enum(["text", "email", "password", "number", "url"]).optional(),
  rules: rulesSchema,
  value: reactive(z.string().optional()),
});
