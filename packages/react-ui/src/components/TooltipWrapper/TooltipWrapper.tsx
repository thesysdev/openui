import * as Tooltip from "@radix-ui/react-tooltip";
import clsx from "clsx";
import React, { cloneElement, isValidElement, useLayoutEffect, useRef, useState } from "react";
import { useTheme } from "../ThemeProvider";

export interface TooltipWrapperProps {
  tooltipHeading?: string;
  tooltipContent?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  className?: string;
  delayDuration?: number;
  showOnlyWhenTruncated?: boolean;
  headingSelector?: string;
  contentSelector?: string;
}

export const TooltipWrapper = ({
  tooltipHeading,
  tooltipContent,
  children,
  className,
  side = "bottom",
  align = "start",
  sideOffset = 5,
  alignOffset = 0,
  delayDuration = 100,
  showOnlyWhenTruncated = false,
  headingSelector,
  contentSelector,
}: React.PropsWithChildren<TooltipWrapperProps>) => {
  const { portalThemeClassName } = useTheme();
  const triggerRef = useRef<HTMLElement>(null);
  const [isHeadingTruncated, setIsHeadingTruncated] = useState(false);
  const [isContentTruncated, setIsContentTruncated] = useState(false);

  const child = React.Children.only(children);
  const triggerWithRef =
    isValidElement(child) && showOnlyWhenTruncated
      ? cloneElement(child as React.ReactElement, { ref: triggerRef } as any)
      : children;

  useLayoutEffect(() => {
    const measure = () => {
      if (triggerRef.current) {
        const { children: childNodes } = triggerRef.current;
        const elements = Array.from(childNodes);

        const headingEl = headingSelector
          ? (triggerRef.current.querySelector(headingSelector) ?? undefined)
          : tooltipHeading
            ? elements[0]
            : undefined;
        const contentEl = contentSelector
          ? (triggerRef.current.querySelector(contentSelector) ?? undefined)
          : tooltipContent
            ? tooltipHeading
              ? elements[1]
              : elements[elements.length - 1]
            : undefined;

        if (headingEl) {
          const isNowTruncated =
            headingEl.scrollWidth > headingEl.clientWidth ||
            headingEl.scrollHeight > headingEl.clientHeight;
          if (isNowTruncated !== isHeadingTruncated) {
            setIsHeadingTruncated(isNowTruncated);
          }
        } else if (isHeadingTruncated) {
          setIsHeadingTruncated(false);
        }

        if (contentEl) {
          const isNowTruncated =
            contentEl.scrollWidth > contentEl.clientWidth ||
            contentEl.scrollHeight > contentEl.clientHeight;
          if (isNowTruncated !== isContentTruncated) {
            setIsContentTruncated(isNowTruncated);
          }
        } else if (isContentTruncated) {
          setIsContentTruncated(false);
        }
      }
    };

    if (showOnlyWhenTruncated) {
      measure();
      const resizeObserver = new ResizeObserver(measure);
      const trigger = triggerRef.current;
      if (trigger) {
        resizeObserver.observe(trigger);
      }
      return () => {
        if (trigger) {
          resizeObserver.unobserve(trigger);
        }
      };
    }

    return undefined;
  }, [
    children,
    showOnlyWhenTruncated,
    isHeadingTruncated,
    isContentTruncated,
    tooltipHeading,
    tooltipContent,
    headingSelector,
    contentSelector,
  ]);

  const displayTooltipHeading = showOnlyWhenTruncated
    ? isHeadingTruncated
      ? tooltipHeading
      : undefined
    : tooltipHeading;
  const displayTooltipContent = showOnlyWhenTruncated
    ? isContentTruncated
      ? tooltipContent
      : undefined
    : tooltipContent;

  const hasContent = displayTooltipHeading || displayTooltipContent;
  if (!hasContent) {
    return <>{triggerWithRef}</>;
  }

  return (
    <Tooltip.Provider>
      <Tooltip.Root delayDuration={delayDuration}>
        <Tooltip.Trigger asChild>{triggerWithRef}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className={clsx("openui-tooltip-content", portalThemeClassName, className)}
            side={side}
            align={align}
            sideOffset={sideOffset}
            alignOffset={alignOffset}
          >
            <div className={"openui-tooltip-body"}>
              {displayTooltipHeading && (
                <span className={"openui-tooltip-heading"}>{displayTooltipHeading}</span>
              )}
              {displayTooltipContent && (
                <span className={"openui-tooltip-text-content"}>{displayTooltipContent}</span>
              )}
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
