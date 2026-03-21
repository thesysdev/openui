import { z } from "zod";
import { Input } from "../Input";
import { RadioGroup } from "../RadioGroup";
import { Select } from "../Select";
import { TextArea } from "../TextArea";

export const FormControlSchema = z.object({
  label: z.string(),
  input: z.union([
    Input.ref,
    TextArea.ref,
    Select.ref,
    RadioGroup.ref,
  ]),
  hint: z.string().optional(),
});
