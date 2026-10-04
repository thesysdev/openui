"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import type { ReactElement } from "react";
import { type ButtonProps } from "../../../../components/Button";
import { Buttons } from "../../../../components/Buttons";
import { type IconButtonProps } from "../../../../components/IconButton";
import { buttonGroupPropsSchema, type ButtonGroupProps } from "./schema";

function ButtonGroupRenderer({ props, renderNode }: ComponentRenderProps<ButtonGroupProps>) {
  return (
    <Buttons variant={(props.direction ?? "row") === "column" ? "vertical" : "horizontal"}>
      {renderNode(props.buttons) as ReactElement<ButtonProps | IconButtonProps>[]}
    </Buttons>
  );
}

export const ButtonGroupComponent = defineComponent({
  name: "ButtonGroup",
  props: buttonGroupPropsSchema,
  description: "",
  component: ButtonGroupRenderer,
});
