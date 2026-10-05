"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
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
    const errors = formValidation?.errors as Record<string, string> | undefined;
    const error = fieldName ? errors?.[fieldName] : undefined;

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {props.label}
        </Typography>
        {renderNode(props.field)}
        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}
      </Box>
    );
  },
});
