"use client";

import clsx from "clsx";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import { IconWrapper } from "../Icon/IconWrapper";
import { type IconTagProps } from "./schema";

export function IconTagView(props: IconTagProps) {
  const icon = props.icon;
  const iconName = icon?.props?.name ?? (typeof icon === "string" ? icon : "");
  const iconCategory = icon?.props?.category;

  if (!iconName) return null;

  return (
    <div
      className={clsx(
        `${DASHBOARD_CLASS_PREFIX}-icon-tag`,
        `${DASHBOARD_CLASS_PREFIX}-icon-tag--${props.size}`,
        `${DASHBOARD_CLASS_PREFIX}-icon-tag--${props.variant}`,
      )}
    >
      <IconWrapper name={iconName} category={iconCategory} />
    </div>
  );
}
