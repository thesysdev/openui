import clsx from "clsx";
import { CSSProperties, forwardRef, ReactNode } from "react";

/** @deprecated Tag has a single 24px size; kept so existing callers compile. */
export type TagSize = "sm" | "md" | "lg";
export type TagVariant =
  "neutral" | "info" | "success" | "warning" | "danger" | "purple" | "pink" | "inverted";

const variantMap: Record<TagVariant, string> = {
  neutral: "openui-tag-neutral",
  info: "openui-tag-info",
  success: "openui-tag-success",
  warning: "openui-tag-warning",
  danger: "openui-tag-danger",
  purple: "openui-tag-purple",
  pink: "openui-tag-pink",
  inverted: "openui-tag-inverted",
};

export interface TagProps {
  className?: string;
  styles?: CSSProperties;
  icon?: ReactNode;
  text: ReactNode;
  /** @deprecated Ignored: every Tag is a 24px pill. */
  size?: TagSize;
  variant?: TagVariant;
}

export const Tag = forwardRef<HTMLDivElement, TagProps>((props, ref) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { className, styles, icon, text, size: _size, variant = "neutral", ...rest } = props;
  return (
    <div
      ref={ref}
      className={clsx("openui-tag", variantMap[variant], className)}
      style={styles}
      {...rest}
    >
      {icon && <span className="openui-tag-icon">{icon}</span>}
      <span className="openui-tag-text">{text}</span>
    </div>
  );
});

Tag.displayName = "Tag";
