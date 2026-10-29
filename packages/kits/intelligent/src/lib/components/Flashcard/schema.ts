import { z } from "zod/v4";
import { slot } from "../slot";

export const FlashcardSchema = z.object({ front: slot, back: slot, hint: z.string().optional() });

export type FlashcardProps = z.infer<typeof FlashcardSchema>;
