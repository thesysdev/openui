"use client";

import clsx from "clsx";
import { CSSProperties, forwardRef, ReactNode, useContext } from "react";
import { names, tagStyles } from "./tag.styles";
import { TagSurfaceContext } from "./TagSurface";

export type TagSize = "sm" | "md" | "lg";
export type TagVariant = "neutral" | "info" | "success" | "warning" | "danger";
export type TagSurface = "image";

export interface TagProps {
  className?: string;
  styles?: CSSProperties;
  icon?: ReactNode;
  text: ReactNode;
  size?: TagSize;
  variant?: TagVariant;
  /**
   * `"image"` for a Tag laid over a photo: a translucent dark fill, white text and a backdrop blur
   * in place of the variant's colours. Context and Visual cards set it for the Tags in their image
   * slot; omit it for the variant's own look.
   */
  surface?: TagSurface;
}

export const Tag = forwardRef<HTMLDivElement, TagProps>((props, ref) => {
  const { className, styles, icon, text, size = "md", variant = "neutral", ...rest } = props;
  const { surface: ownSurface, ...attributes } = rest;
  // A card's tag slot supplies the surface when the caller leaves it out.
  const slotSurface = useContext(TagSurfaceContext);
  const surface = ownSurface ?? slotSurface;
  const css = tagStyles;
  return (
    <div
      ref={ref}
      className={clsx(
        css.root,
        names.root,
        css.size[size],
        names.size[size],
        css.variant[variant],
        names.variant[variant],
        surface && [css.surface[surface], names.surface[surface]],
        className,
      )}
      style={styles}
      {...attributes}
    >
      {icon && <span className={clsx(css.icon, names.icon)}>{icon}</span>}
      <span className={clsx(css.text, names.text)}>{text}</span>
    </div>
  );
});

Tag.displayName = "Tag";
