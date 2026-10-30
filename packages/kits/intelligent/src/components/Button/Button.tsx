import { Button as RCButton } from "@openuidev/react-components";
import type { ComponentProps } from "react";
import { cx } from "../../shared/style";
import { Glyph } from "../Icon/Glyph";

const VARIANT = { solid: "primary", outline: "secondary", soft: "tertiary", ghost: "tertiary" } as const;

const SIZE = { sm: "small", md: "medium", lg: "large" } as const;

// null as well as undefined: a program writes a skipped argument as null.
export interface ButtonProps extends Omit<ComponentProps<typeof RCButton>, "variant" | "size" | "color"> {
  variant?: keyof typeof VARIANT | null;
  size?: keyof typeof SIZE | null;
  color?: "primary" | "danger" | "success" | null;
  /** A lucide icon name, shown before the label. */
  icon?: string | null;
  /** Fills the width of its column. */
  block?: boolean | null;
}

/**
 * react-components' Button with the Intelligent UI look. solid, outline, soft
 * and ghost map to primary, secondary, tertiary and tertiary; the kit's
 * openui-intelligent-button-* classes point the button's --openui-* tokens at the kit's own
 * (a pill, 560 weight, ink for solid, the kit's danger and success), so it
 * follows the kit's light and dark themes. Timer's buttons and
 * SegmentedControl's options are this Button too.
 */
export function Button({ variant: variantProp, size: sizeProp, color, icon, block, className, children, ...rest }: ButtonProps) {
  const variant = variantProp ?? "solid";
  const size = sizeProp ?? "md";
  return (
    <RCButton
      type="button"
      variant={VARIANT[variant]}
      size={SIZE[size]}
      className={cx(
        "openui-intelligent-button",
        `openui-intelligent-button-${variant}`,
        color && color !== "primary" && `openui-intelligent-button-${color}`,
        `openui-intelligent-button-${size}`,
        block && "openui-intelligent-block",
        className,
      )}
      iconLeft={icon ? <Glyph name={icon} size={size === "sm" ? 14 : 16} /> : undefined}
      {...rest}
    >
      {children}
    </RCButton>
  );
}
