import { z } from "zod/v4";
import { slot } from "../schemas";

export const PopoverSchema = z.object({ trigger: slot, content: slot });

export type PopoverProps = z.infer<typeof PopoverSchema>;
