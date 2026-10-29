import { z } from "zod/v4";
import { slot } from "../slot";

export const PopoverSchema = z.object({ trigger: slot, content: slot });

export type PopoverProps = z.infer<typeof PopoverSchema>;
