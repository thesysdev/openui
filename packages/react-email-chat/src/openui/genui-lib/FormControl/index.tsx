"use client";

import { defineComponent, useFormValidation } from "@openuidev/react-lang";
import { AlertCircle } from "lucide-react";
import { FormControl as OpenUIFormControl } from "@openuidev/react-ui/FormControl";
import { Hint as OpenUIHint } from "@openuidev/react-ui/FormControl/Hint";
import { Label as OpenUILabel } from "@openuidev/react-ui/Label";
import { FormControlSchema } from "./schema";

export { FormControlSchema } from "./schema";

export const FormControl = defineComponent({
  name: "FormControl",
  props: FormControlSchema,
  description: "Field with label, input component, and optional hint text",
  component: ({ props, renderNode }) => {
    const formValidation = useFormValidation();
    const inputObj = props.input as any;
    const fieldName =
      inputObj?.type === "element" ? (inputObj.props?.name as string | undefined) : undefined;
    const error = fieldName ? formValidation?.errors[fieldName] : undefined;
    const isRequired = inputObj?.type === "element" && inputObj.props?.rules?.required === true;

    return (
      <OpenUIFormControl>
        <OpenUILabel className="text-sm font-medium" required={isRequired}>
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
  },
});
