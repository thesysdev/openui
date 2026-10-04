import { z } from "zod/v4";
import { ButtonComponent } from "../Button/Button";

export const buttonGroupPropsSchema = z.object({
  buttons: z.array(ButtonComponent.ref),
  direction: z.enum(["row", "column"]).optional(),
});

export type ButtonGroupProps = z.infer<typeof buttonGroupPropsSchema>;
