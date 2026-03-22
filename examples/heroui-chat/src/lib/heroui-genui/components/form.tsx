"use client";

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
  description: "Form container with fields and explicit action buttons",
  component: ({ props, renderNode }) => {
    const formValidation = useCreateFormValidation();
    const formName = props.name;

    return (
      <FormValidationContext.Provider value={formValidation}>
        <FormNameContext.Provider value={formName}>
          <div
            role="form"
            className="flex flex-col gap-4"
          >
            {renderNode(props.fields)}
            {renderNode(props.buttons)}
          </div>
        </FormNameContext.Provider>
      </FormValidationContext.Provider>
    );
  },
});
