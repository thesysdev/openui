"use client";

import { Form as HeroForm, Surface } from "@heroui/react";
import {
  type ComponentRenderProps,
  FormNameContext,
  FormValidationContext,
  defineComponent,
  useCreateFormValidation,
} from "@openuidev/react-lang";
import { z } from "zod";

import { Buttons } from "./buttons";
import { FormControl } from "./form-control";
import { FormRow } from "./form-row";

const FormSchema = z.object({
  name: z.string(),
  title: z.string(),
  description: z.string().optional(),
  buttons: Buttons.ref,
  fields: z.array(z.union([FormControl.ref, FormRow.ref])).default([]),
});

type FormProps = z.infer<typeof FormSchema>;

function FormRenderer({ props, renderNode }: ComponentRenderProps<FormProps>) {
  const formValidation = useCreateFormValidation();
  const formName = props.name;

  return (
    <FormValidationContext.Provider value={formValidation}>
      <FormNameContext.Provider value={formName}>
        <HeroForm className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">{props.title}</h2>
            {props.description && (
              <p className="text-sm text-default-500">{props.description}</p>
            )}
          </div>
          <Surface variant="secondary" className="flex flex-col gap-4 rounded-xl p-4 opacity-70">
            {renderNode(props.fields)}
          </Surface>
          {renderNode(props.buttons)}
        </HeroForm>
      </FormNameContext.Provider>
    </FormValidationContext.Provider>
  );
}

export const Form = defineComponent({
  name: "Form",
  props: FormSchema,
  description: "Form container with title, optional description, fields, and action buttons",
  component: FormRenderer,
});
