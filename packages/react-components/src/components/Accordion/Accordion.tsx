"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import clsx from "clsx";
import { ChevronDownIcon } from "lucide-react";
import React, { forwardRef } from "react";
import { accordionStyles, names } from "./accordion.styles";

type AccordionVariant = "clear" | "card" | "sunk";

export type AccordionProps = (
  AccordionPrimitive.AccordionSingleProps | AccordionPrimitive.AccordionMultipleProps
) & {
  variant?: AccordionVariant;
};

export const Accordion = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Root>,
  AccordionProps
>(({ className, style, variant = "clear", ...props }, ref) => {
  const styles = accordionStyles;
  return (
    <AccordionPrimitive.Root
      ref={ref}
      className={clsx(
        styles.root,
        names.root,
        styles.variant[variant],
        names.variant[variant],
        className,
      )}
      style={style}
      {...props}
    />
  );
});

export interface AccordionItemProps extends React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Item
> {
  className?: string;
  style?: React.CSSProperties;
  value: string;
}

export const AccordionItem = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, style, value, ...props }, ref) => {
  const styles = accordionStyles;
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

export interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Trigger
> {
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  text: React.ReactNode;
}
export const AccordionTrigger = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, style, text, icon, ...props }, ref) => {
  const styles = accordionStyles;
  return (
    <AccordionPrimitive.Header className={clsx(styles.header, names.header)}>
      <AccordionPrimitive.Trigger
        ref={ref}
        className={clsx(styles.trigger, names.trigger, className)}
        style={style}
        {...props}
      >
        <div className={clsx(styles.triggerContent, names.triggerContent)}>
          {icon && (
            <span className={clsx(styles.triggerContentIcon, names.triggerContentIcon)}>
              {icon}
            </span>
          )}
          {text}
        </div>
        <ChevronDownIcon className={clsx(styles.triggerIcon, names.triggerIcon)} />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

export interface AccordionContentProps extends React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Content
> {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export const AccordionContent = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, style, children, ...props }, ref) => {
  const styles = accordionStyles;
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={clsx(styles.content, names.content, className)}
      style={style}
      {...props}
    >
      <div className={clsx(styles.contentWrapper, names.contentWrapper)}>{children}</div>
    </AccordionPrimitive.Content>
  );
});
