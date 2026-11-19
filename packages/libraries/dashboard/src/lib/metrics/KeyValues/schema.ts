import { z } from "zod/v4";
import { KeyValueComponent } from "../KeyValue";

export const keyValuesPropsSchema = z.object({
  rows: z.array(KeyValueComponent.ref),
});
export type KeyValuesSchemaProps = z.infer<typeof keyValuesPropsSchema>;
