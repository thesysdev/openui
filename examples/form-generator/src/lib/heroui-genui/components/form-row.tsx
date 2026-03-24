"use client";

import { type ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

import { FormControl } from "./form-control";

const FormRowSchema = z.object({
  fields: z.array(FormControl.ref),
});

type FormRowProps = z.infer<typeof FormRowSchema>;

function FormRowRenderer({ props, renderNode }: ComponentRenderProps<FormRowProps>) {
  return (
    <div className="flex flex-row gap-4">
      {props.fields.map((field, i) => (
        <div key={i} className="flex-1 min-w-0">
          {renderNode(field)}
        </div>
      ))}
    </div>
  );
}

export const FormRow = defineComponent({
  name: "FormRow",
  props: FormRowSchema,
  description:
    "Horizontal row that places multiple FormControl fields side-by-side, each sharing equal width. Use for short paired fields like First Name / Last Name or City / State / ZIP.",
  component: FormRowRenderer,
});
