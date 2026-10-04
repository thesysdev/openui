import { z } from "zod/v4";
import { CheckBoxGroup } from "../CheckBoxGroup";
import { Chips } from "../Chips";
import { DatePicker } from "../DatePicker";
import { Input } from "../Input";
import { OptionCards } from "../OptionCards";
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
    Chips.ref,
    OptionCards.ref,
  ]),
  hint: z.string().optional(),
});
