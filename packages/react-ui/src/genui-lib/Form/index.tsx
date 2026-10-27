"use client";

import {
  ComponentRenderProps,
  defineComponent,
  FormNameContext,
  FormValidationContext,
  useCreateFormValidation,
} from "@openuidev/react-lang";
import { FormSchema } from "./schema";

export { FormRow, FormRowSchema } from "./FormRow";
export { FormSchema } from "./schema";

type FormRenderProps = ComponentRenderProps<{ name: string; buttons: unknown; fields: unknown }>;

/** Shared renderer — also used by the chat library's Form variant (wider FormControl). */
export const FormRenderer = ({ props, renderNode }: FormRenderProps) => {
  const formValidation = useCreateFormValidation();
  const formName = props.name as string;

  return (
    <FormValidationContext.Provider value={formValidation}>
      <FormNameContext.Provider value={formName}>
        <div
          role="form"
          className="openui-genui-form"
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
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
  description:
    "Form container for essential input that cannot be picked from options, such as a name, an email, exact dates or free text: Form(name, buttons, fields), with one FormControl or FormRow per field and exactly one primary submit Button. Keep it to the fewest fields. When the user is choosing between options, offer tappable ImageCard or InsightCard tiles or Buttons instead of a Form.",
  component: FormRenderer,
});
