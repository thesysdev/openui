"use client";

import { Label as ShadcnLabel } from "@/components/ui/label";
import { defineComponent, useFormValidation } from "@openuidev/react-lang";
import { z } from "zod";

const FormControlSchema = z.object({
  label: z.string(),
  field: z.any(),
});

export const FormControl = defineComponent({
  name: "FormControl",
  props: FormControlSchema,
  description: "Wraps a form field with a label and error display.",
  component: ({ props, renderNode }) => {
    const formValidation = useFormValidation();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldName = (props.field as any)?.props?.name as string | undefined;
    const error = fieldName ? formValidation?.errors?.[fieldName] : undefined;

    return (
      <div className="space-y-2">
        <ShadcnLabel>{props.label}</ShadcnLabel>
        {renderNode(props.field)}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  },
});
