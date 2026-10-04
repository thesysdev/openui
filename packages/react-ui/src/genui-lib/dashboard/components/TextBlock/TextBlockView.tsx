"use client";

import clsx from "clsx";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import type { TextBlockProps } from "./schema";

export function TextBlockView(props: TextBlockProps) {
  const secondaryStyle =
    props.secondaryMaxLines !== undefined
      ? {
          display: "-webkit-box",
          WebkitLineClamp: props.secondaryMaxLines,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }
      : undefined;

  return (
    <div
      className={clsx(
        `${DASHBOARD_CLASS_PREFIX}-text-block`,
        `${DASHBOARD_CLASS_PREFIX}-text-block--${props.variant}`,
        `${DASHBOARD_CLASS_PREFIX}-text-block--size-${props.size}`,
        `${DASHBOARD_CLASS_PREFIX}-text-block--align-${props.align}`,
        `${DASHBOARD_CLASS_PREFIX}-text-block--type-${props.type}`,
      )}
    >
      <div className={`${DASHBOARD_CLASS_PREFIX}-text-block__primary`}>{props.primary}</div>
      {props.secondary && (
        <div
          className={clsx(
            `${DASHBOARD_CLASS_PREFIX}-text-block__secondary`,
            props.secondaryTone &&
              `${DASHBOARD_CLASS_PREFIX}-text-block__secondary--${props.secondaryTone}`,
          )}
          style={secondaryStyle}
        >
          {props.secondary}
        </div>
      )}
      {props.tertiary && (
        <div className={`${DASHBOARD_CLASS_PREFIX}-text-block__tertiary`}>{props.tertiary}</div>
      )}
    </div>
  );
}
