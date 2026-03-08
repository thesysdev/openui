import { z } from "zod";
import { Buttons } from "../Buttons";
import { FormControl } from "../FormControl";

export const FormSchema = z.object({
  name: z.string(),
  fields: z.array(FormControl.ref),
  buttons: Buttons.ref,
});
