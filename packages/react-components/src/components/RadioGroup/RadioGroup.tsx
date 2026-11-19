"use client";

import * as Radio from "@radix-ui/react-radio-group";
import clsx from "clsx";
import { CSSProperties, forwardRef, ReactElement } from "react";
import { RadioItemProps } from "../RadioItem";
import { names, radioGroupStyles } from "./radioGroup.styles";

type RadioGroupVariant = "clear" | "card" | "sunk";
interface RadioGroupProps extends Radio.RadioGroupProps {
  children: ReactElement<RadioItemProps> | ReactElement<RadioItemProps>[];
  variant?: RadioGroupVariant;
  className?: string;
  style?: CSSProperties;
}

const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>((props, ref) => {
  const { children, className, style, variant = "clear", ...rest } = props;
  const styles = radioGroupStyles;
  return (
    <Radio.Root
      ref={ref}
      className={clsx(
        styles.root,
        names.root,
        styles.variant[variant],
        names.variant[variant],
        className,
      )}
      style={style}
      {...rest}
    >
      {children}
    </Radio.Root>
  );
});

RadioGroup.displayName = "RadioGroup";

export { RadioGroup, type RadioGroupProps };
