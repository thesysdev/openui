"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import clsx from "clsx";
import { ReactElement } from "react";
import { ToggleItemProps } from "../ToggleItem";
import { names, toggleGroupStyles } from "./toggleGroup.styles";

type RadixToggleGroupProps =
  ToggleGroupPrimitive.ToggleGroupSingleProps | ToggleGroupPrimitive.ToggleGroupMultipleProps;

export type ToggleGroupProps = RadixToggleGroupProps & {
  className?: string;
  children: ReactElement<ToggleItemProps> | ReactElement<ToggleItemProps>[];
};

export const ToggleGroup = ({ children, className, ...props }: ToggleGroupProps) => {
  const styles = toggleGroupStyles;
  return (
    <ToggleGroupPrimitive.Root className={clsx(styles.root, names.root, className)} {...props}>
      {children}
    </ToggleGroupPrimitive.Root>
  );
};
