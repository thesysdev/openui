import { z } from "zod/v4";
import { stateSchema } from "../../../shared/schema";

export const statesPropsSchema = z.object({
  states: z.array(stateSchema),
});
export type StatesSchemaProps = z.infer<typeof statesPropsSchema>;
