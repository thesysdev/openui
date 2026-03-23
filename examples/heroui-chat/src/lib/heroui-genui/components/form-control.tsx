"use client";

import { Description, Label } from "@heroui/react";
import {
  type ComponentRenderProps,
  defineComponent,
  useFormValidation,
} from "@openuidev/react-lang";
import { z } from "zod";

import { CheckBoxGroup } from "./checkbox-group";
import { Input } from "./input";
import { NumberField } from "./number-field";
import { RadioGroup } from "./radio-group";
import { Select } from "./select";
import { Slider } from "./slider";
// import { SwitchGroup } from "./switch-group"; // disabled: scroll/layout issue on long forms
import { TextArea } from "./textarea";

const FormControlSchema = z.object({
  label: z.string(),
  input: z.union([
    Input.ref,
    TextArea.ref,
    Select.ref,
    Slider.ref,
    CheckBoxGroup.ref,
    RadioGroup.ref,
    // SwitchGroup.ref, // disabled: scroll/layout issue on long forms
    NumberField.ref,
  ]),
  hint: z.string().optional(),
});

/** Extract field name from input element (Input, Select, etc. all have name in props) */
function getFieldNameFromInput(input: unknown): string | undefined {
  const obj = input as { type?: string; props?: { name?: string } } | undefined;
  return obj?.type === "element" ? obj.props?.name : undefined;
}

type FormControlProps = z.infer<typeof FormControlSchema>;

function FormControlRenderer({
  props,
  renderNode,
}: ComponentRenderProps<FormControlProps>) {
  const formValidation = useFormValidation();
  const inputObj = props.input as {
    type?: string;
    props?: { name?: string; rules?: { required?: boolean } };
  };
  const fieldName = getFieldNameFromInput(props.input);
  const error = fieldName ? formValidation?.errors[fieldName] : undefined;
  const isRequired =
    inputObj?.type === "element" && inputObj.props?.rules?.required === true;

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium" htmlFor={fieldName}>
        {props.label}
        {isRequired && <span className="text-danger ml-0.5">*</span>}
      </Label>
      {renderNode(props.input)}
      {error ? (
        <p className="text-danger text-sm mt-0.5" role="alert">
          {error}
        </p>
      ) : props.hint ? (
        <Description className="text-sm text-default-500 mt-0.5">
          {props.hint}
        </Description>
      ) : null}
    </div>
  );
}

export const FormControl = defineComponent({
  name: "FormControl",
  props: FormControlSchema,
  description: "Field with label, input component, and optional hint text",
  component: FormControlRenderer,
});
