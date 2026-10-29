"use client";

import { Button as RCButton } from "@openuidev/react-components";
import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import type { ComponentProps } from "react";
import { useRunAction } from "../controlHelpers";
import { Glyph } from "../glyph";
import { cx } from "../style";
import { ButtonSchema } from "./schema";

export * from "./schema";

/**
 * react-components' Button with the Intelligent UI look. solid, outline, soft
 * and ghost map to primary, secondary, tertiary and tertiary; the kit's
 * iui-button-* classes point the button's --openui-* tokens at the kit's own
 * (a pill, 560 weight, ink for solid, the kit's danger and success), so it
 * looks as before and follows the kit's light and dark themes.
 */
const VARIANT = { solid: "primary", outline: "secondary", soft: "tertiary", ghost: "tertiary" } as const;
const SIZE = { sm: "small", md: "medium", lg: "large" } as const;

// null as well as undefined: a program writes a skipped argument as null.
type Look = {
  variant?: keyof typeof VARIANT | null;
  size?: keyof typeof SIZE | null;
  color?: "primary" | "danger" | "success" | null;
  icon?: string | null;
  block?: boolean | null;
};

/** react-components' Button in the kit's look. Button draws with it, and so do Timer's own buttons. */
export function ButtonView({
  variant: variantProp,
  size: sizeProp,
  color,
  icon,
  block,
  children,
  ...rest
}: Look & Omit<ComponentProps<typeof RCButton>, "variant" | "size" | "color">) {
  const variant = variantProp ?? "solid";
  const size = sizeProp ?? "md";
  return (
    <RCButton
      type="button"
      variant={VARIANT[variant]}
      size={SIZE[size]}
      className={cx(
        "iui-button",
        `iui-button-${variant}`,
        color && color !== "primary" && `iui-button-${color}`,
        `iui-button-${size}`,
        block && "iui-block",
      )}
      iconLeft={icon ? <Glyph name={icon} size={size === "sm" ? 14 : 16} /> : undefined}
      {...rest}
    >
      {children}
    </RCButton>
  );
}

export const Button = defineComponent({
  name: "Button",
  props: ButtonSchema,
  description: "icon is a lucide name.",
  component: ({ props }) => {
    const run = useRunAction();
    const streaming = useIsStreaming();
    const label = String(props.label ?? "");
    return (
      <ButtonView
        variant={props.variant}
        size={props.size}
        color={props.color}
        icon={props.icon}
        block={props.block}
        disabled={!!props.disabled || streaming}
        onClick={() => run(label, props.action, true)}
      >
        {label}
      </ButtonView>
    );
  },
});
