import { z } from "zod/v4";
import { Buttons } from "../Buttons";
import { FormControl } from "../FormControl";
import { FormRow } from "./FormRow";

export const FormSchema = z.object({
  name: z.string(),
  buttons: Buttons.ref,
  fields: z.array(z.union([FormControl.ref, FormRow.ref])).default([]),
});
