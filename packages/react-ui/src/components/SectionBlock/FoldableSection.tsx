import * as AccordionPrimitive from "@radix-ui/react-accordion";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import React, { forwardRef } from "react";
import { IconButton } from "../IconButton";
import { Separator } from "../Separator";
import "./foldableSection.scss";

export type FoldableSectionRootProps = AccordionPrimitive.AccordionMultipleProps;

export const FoldableSectionRoot = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Root>,
  FoldableSectionRootProps
>(({ className, style, ...props }, ref) => (
  <AccordionPrimitive.Root
    ref={ref}
    className={clsx("openui-foldable-section-root", className)}
    style={style}
    {...props}
  />
));
FoldableSectionRoot.displayName = "FoldableSectionRoot";

export interface FoldableSectionItemProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {
  className?: string;
  style?: React.CSSProperties;
  value: string;
}

export const FoldableSectionItem = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  FoldableSectionItemProps
>(({ className, style, value, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={clsx("openui-foldable-section-item", className)}
    style={style}
    value={value}
    {...props}
  />
));
FoldableSectionItem.displayName = "FoldableSectionItem";

export interface FoldableSectionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  className?: string;
  style?: React.CSSProperties;
  text: React.ReactNode;
}

export const FoldableSectionTrigger = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  FoldableSectionTriggerProps
>(({ className, style, text, ...props }, ref) => (
  <AccordionPrimitive.Header className="openui-foldable-section-header">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={clsx("openui-foldable-section-trigger", className)}
      style={style}
      {...props}
    >
      <div className="openui-foldable-section-trigger-content-wrapper">
        <Separator className="openui-foldable-section-trigger-content-separator" />
        <div className="openui-foldable-section-trigger-content-icon-button-wrapper">
          <IconButton
            icon={
              <ChevronRight className="openui-foldable-section-trigger-content-icon-button-icon" />
            }
            size="3-extra-small"
            variant="secondary"
            className="openui-foldable-section-trigger-content-icon-button"
          />
          <div className="openui-foldable-section-trigger-content-text">{text}</div>
        </div>
      </div>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
FoldableSectionTrigger.displayName = "FoldableSectionTrigger";

export interface FoldableSectionContentProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const FoldableSectionContent = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  FoldableSectionContentProps
>(({ className, style, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={clsx("openui-foldable-section-content", className)}
    style={style}
    {...props}
  >
    {children}
  </AccordionPrimitive.Content>
));
FoldableSectionContent.displayName = "FoldableSectionContent";
