import { IconButton as RCIconButton } from "@openuidev/react-components";
import clsx from "clsx";
import type { ComponentProps } from "react";
import { Glyph } from "../Icon/Glyph";
import { names, styles } from "./iconButton.styles";

const VARIANT = { outline: "secondary", ghost: "tertiary", solid: "primary" } as const;

export interface IconButtonProps extends Omit<ComponentProps<typeof RCIconButton>, "icon" | "variant" | "shape" | "size"> {
  /** A lucide icon name. */
  icon: string;
  variant?: keyof typeof VARIANT | null;
}

/**
 * Round, icon-only. outline, ghost and solid map to react-components' secondary, tertiary and
 * primary; primary is the blue accent there, so solid here stays ink.
 */
export function IconButton({ icon, variant: variantProp, className, ...rest }: IconButtonProps) {
  const variant = variantProp ?? "outline";
  return (
    <RCIconButton
      type="button"
      icon={<Glyph name={icon} size={16} />}
      variant={VARIANT[variant]}
      shape="circle"
      size="small"
      className={clsx(styles.root, names.root, variant !== "outline" && styles.variant[variant], names.variant[variant], className)}
      {...rest}
    />
  );
}
