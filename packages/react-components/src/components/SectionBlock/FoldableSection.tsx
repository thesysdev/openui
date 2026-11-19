"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import React, { forwardRef } from "react";
import { IconButton } from "../IconButton";
import { Separator } from "../Separator";
import { foldableSectionStyles, names } from "./foldableSection.styles";

export type FoldableSectionRootProps = AccordionPrimitive.AccordionMultipleProps;

export const FoldableSectionRoot = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Root>,
  FoldableSectionRootProps
>(({ className, style, ...props }, ref) => {
  const styles = foldableSectionStyles;
  return (
    <AccordionPrimitive.Root
      ref={ref}
      className={clsx(styles.root, names.root, className)}
      style={style}
      {...props}
    />
  );
});
FoldableSectionRoot.displayName = "FoldableSectionRoot";

export interface FoldableSectionItemProps extends React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Item
> {
  className?: string;
  style?: React.CSSProperties;
  value: string;
}

export const FoldableSectionItem = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  FoldableSectionItemProps
>(({ className, style, value, ...props }, ref) => {
  const styles = foldableSectionStyles;
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={clsx(styles.item, names.item, className)}
      style={style}
      value={value}
      {...props}
    />
  );
});
FoldableSectionItem.displayName = "FoldableSectionItem";

export interface FoldableSectionTriggerProps extends React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Trigger
> {
  className?: string;
  style?: React.CSSProperties;
  text: React.ReactNode;
}

export const FoldableSectionTrigger = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  FoldableSectionTriggerProps
>(({ className, style, text, ...props }, ref) => {
  const styles = foldableSectionStyles;
  return (
    <AccordionPrimitive.Header className={clsx(styles.header, names.header)}>
      <AccordionPrimitive.Trigger
        ref={ref}
        className={clsx(styles.trigger, names.trigger, className)}
        style={style}
        {...props}
      >
        <div className={clsx(styles.triggerContentWrapper, names.triggerContentWrapper)}>
          <Separator
            className={clsx(styles.triggerContentSeparator, names.triggerContentSeparator)}
          />
          <div
            className={clsx(
              styles.triggerContentIconButtonWrapper,
              names.triggerContentIconButtonWrapper,
            )}
          >
            <IconButton
              asChild
              icon={
                <ChevronRight
                  className={clsx(
                    styles.triggerContentIconButtonIcon,
                    names.triggerContentIconButtonIcon,
                  )}
                />
              }
              size="3-extra-small"
              variant="secondary"
              className={clsx(styles.triggerContentIconButton, names.triggerContentIconButton)}
            >
              <span aria-hidden="true" />
            </IconButton>
            <div className={clsx(styles.triggerContentText, names.triggerContentText)}>{text}</div>
          </div>
        </div>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});
FoldableSectionTrigger.displayName = "FoldableSectionTrigger";

export interface FoldableSectionContentProps extends React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Content
> {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const FoldableSectionContent = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  FoldableSectionContentProps
>(({ className, style, children, ...props }, ref) => {
  const styles = foldableSectionStyles;
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={clsx(styles.content, names.content, className)}
      style={style}
      {...props}
    >
      {children}
    </AccordionPrimitive.Content>
  );
});
FoldableSectionContent.displayName = "FoldableSectionContent";
