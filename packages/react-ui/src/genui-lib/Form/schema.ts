import { z } from "zod/v4";
import { Buttons } from "../Buttons";
import { FormControl } from "../FormControl";

export const FormSchema = z.object({
  name: z.string(),
  buttons: Buttons.ref,
  fields: z.array(FormControl.ref).default([]),
});
