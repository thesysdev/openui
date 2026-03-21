"use client";

import {
  defineComponent,
  FormNameContext,
  FormValidationContext,
  useCreateFormValidation,
} from "@openuidev/react-lang";
import { FormSchema } from "./schema";

export { FormSchema } from "./schema";

export const Form = defineComponent({
  name: "Form",
  props: FormSchema,
  description: "Form container with fields and explicit action buttons",
  component: ({ props, renderNode }) => {
    const formValidation = useCreateFormValidation();
    const formName = props.name as string;

    return (
      <FormValidationContext.Provider value={formValidation}>
        <FormNameContext.Provider value={formName}>
          <div role="form" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {renderNode(props.fields)}
            {renderNode(props.buttons)}
          </div>
        </FormNameContext.Provider>
      </FormValidationContext.Provider>
    );
  },
});
