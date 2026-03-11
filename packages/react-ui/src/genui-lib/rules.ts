import { z } from "zod";

/**
 * Structured validation rules for form field components.
 * Example: { required: true, email: true, minLength: 5, max: 100 }
 * Available keys: required, email, url, numeric, min (number), max (number), minLength (number), maxLength (number), pattern (regex string)
 */
export const rulesSchema = z
  .object({
    required: z.boolean().optional(),
    email: z.boolean().optional(),
    url: z.boolean().optional(),
    numeric: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
  })
  .optional();

export type RulesSchema = z.infer<typeof rulesSchema>;
