"use client";

import Box from "@mui/material/Box";
import {
  FormNameContext,
  FormValidationContext,
  defineComponent,
  useCreateFormValidation,
} from "@openuidev/react-lang";
import { z } from "zod";
import { Buttons } from "./buttons";
import { FormControl } from "./form-control";

const FormSchema = z.object({
  name: z.string(),
  buttons: Buttons.ref,
  fields: z.array(FormControl.ref).default([]),
});

export const Form = defineComponent({
  name: "Form",
  props: FormSchema,
  description:
    "Form container with fields and explicit action buttons. fields: FormControl[], buttons: Buttons.",
  component: ({ props, renderNode }) => {
    const formValidation = useCreateFormValidation();
    const formName = props.name as string;

    return (
      <FormValidationContext.Provider value={formValidation}>
        <FormNameContext.Provider value={formName}>
          <Box role="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {renderNode(props.fields)}
            {renderNode(props.buttons)}
          </Box>
        </FormNameContext.Provider>
      </FormValidationContext.Provider>
    );
  },
});
