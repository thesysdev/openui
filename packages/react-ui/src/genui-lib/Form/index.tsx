"use client";

import {
  ComponentRenderProps,
  defineComponent,
  FormNameContext,
  FormValidationContext,
  useCreateFormValidation,
} from "@openuidev/react-lang";
import { FormSchema } from "./schema";

export { FormSchema } from "./schema";

type FormRenderProps = ComponentRenderProps<{ name: string; buttons: unknown; fields: unknown }>;

/** Shared renderer — also used by the chat library's Form variant (wider FormControl). */
export const FormRenderer = ({ props, renderNode }: FormRenderProps) => {
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
};

export const Form = defineComponent({
  name: "Form",
  props: FormSchema,
  description: "Form container with fields and explicit action buttons",
  component: FormRenderer,
});
