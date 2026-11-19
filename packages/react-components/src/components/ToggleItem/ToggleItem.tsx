"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import clsx from "clsx";
import { ReactNode } from "react";
import { names, toggleItemStyles } from "./toggleItem.styles";

export interface ToggleItemProps extends ToggleGroupPrimitive.ToggleGroupItemProps {
  children: ReactNode;
  className?: string;
}

export const ToggleItem = ({ className, children, ...props }: ToggleItemProps) => {
  const styles = toggleItemStyles;
  return (
    <ToggleGroupPrimitive.Item className={clsx(styles.root, names.root, className)} {...props}>
      {children}
    </ToggleGroupPrimitive.Item>
  );
};
