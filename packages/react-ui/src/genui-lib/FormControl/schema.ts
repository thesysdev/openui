import { z } from "zod/v4";
import { CheckBoxGroup } from "../CheckBoxGroup";
import { DatePicker } from "../DatePicker";
import { Input } from "../Input";
import { RadioGroup } from "../RadioGroup";
import { Select } from "../Select";
import { Slider } from "../Slider";
import { TextArea } from "../TextArea";

export const FormControlSchema = z.object({
  label: z.string(),
  input: z.union([
    Input.ref,
    TextArea.ref,
    Select.ref,
    DatePicker.ref,
    Slider.ref,
    CheckBoxGroup.ref,
    RadioGroup.ref,
  ]),
  hint: z.string().optional(),
});
