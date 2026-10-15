"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import { FormControl } from "../FormControl";

export const FormRowSchema = z.object({
  fields: z.array(FormControl.ref),
});

export const FormRow = defineComponent({
  name: "FormRow",
  props: FormRowSchema,
  description:
    "Puts 2–3 short, related FormControls side by side inside a Form, such as first and last name or city and postcode: FormRow([firstName, lastName]). The fields share the width equally and stack into one column when the Form is narrow. Mix FormRows with full-width FormControls in the same Form fields list; long fields like TextArea stay full width.",
  component: ({ props, renderNode }) => {
    const fields = (props.fields ?? []) as unknown[];
    return (
      <div className="openui-genui-form-row">
        <div
          className="openui-genui-form-row__grid"
          style={{ "--openui-form-row-columns": Math.max(fields.length, 1) } as React.CSSProperties}
        >
          {renderNode(fields)}
        </div>
      </div>
    );
  },
});
