import { z } from "zod/v4";
import { children } from "../style";

export const FormSchema = z.object({
  children,
});

export type FormProps = z.infer<typeof FormSchema>;
