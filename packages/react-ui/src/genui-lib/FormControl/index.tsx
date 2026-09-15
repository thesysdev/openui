"use client";

import { ComponentRenderProps, defineComponent, useFormValidation } from "@openuidev/react-lang";
import { AlertCircle } from "lucide-react";
import { FormControl as OpenUIFormControl } from "../../components/FormControl";
import { Hint as OpenUIHint } from "../../components/FormControl/Hint";
import { Label as OpenUILabel } from "../../components/Label";
import { FormControlSchema } from "./schema";

export { FormControlSchema } from "./schema";

/**
 * Shared renderer — also used by the chat library's FormControl variant, which
 * accepts a wider set of input components (Chips, OptionCards).
 */
type FormControlRenderProps = ComponentRenderProps<{
  label: string;
  input: unknown;
  hint?: string;
}>;

export const FormControlRenderer = ({ props, renderNode }: FormControlRenderProps) => {
  const formValidation = useFormValidation();
  const inputObj = props.input as any;
  // Extract the field name from the rendered input element props.
  const rawName = inputObj?.type === "element" ? inputObj.props?.name : undefined;
  const fieldName =
    typeof rawName === "object" && rawName?.name ? rawName.name : (rawName as string | undefined);
  const error = fieldName ? formValidation?.errors[fieldName] : undefined;
  const isRequired = inputObj?.type === "element" && inputObj.props?.rules?.required === true;

  return (
    <OpenUIFormControl>
      <OpenUILabel className="text-sm font-medium" required={isRequired} htmlFor={fieldName}>
        {props.label as string}
      </OpenUILabel>
      {renderNode(props.input)}
      {error ? (
        <OpenUIHint hasError={true}>
          <AlertCircle size={14} />
          {error}
        </OpenUIHint>
      ) : props.hint ? (
        <OpenUIHint>{props.hint as string}</OpenUIHint>
      ) : null}
    </OpenUIFormControl>
  );
};

export const FormControl = defineComponent({
  name: "FormControl",
  props: FormControlSchema,
  description: "Field with label, input component, and optional hint text",
  component: FormControlRenderer,
});
