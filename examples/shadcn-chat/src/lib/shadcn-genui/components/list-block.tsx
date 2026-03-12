"use client";

import { BuiltinActionType, defineComponent, useTriggerAction } from "@openuidev/react-lang";
import { ChevronRight } from "lucide-react";
import { z } from "zod";
import { actionSchema, type ActionSchema } from "../action";

const ListItemSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  image: z.object({ src: z.string(), alt: z.string() }).optional(),
  actionLabel: z.string().optional(),
  action: actionSchema,
});

export const ListItem = defineComponent({
  name: "ListItem",
  props: ListItemSchema,
  description:
    "Item in a ListBlock — title, optional subtitle/image. When action is provided, item is clickable.",
  component: () => null,
});

const ListBlockSchema = z.object({
  items: z.array(ListItem.ref),
  variant: z.enum(["number", "image"]).optional(),
});

export const ListBlock = defineComponent({
  name: "ListBlock",
  props: ListBlockSchema,
  description:
    'List of clickable items. variant: "number" | "image". Items with action are clickable.',
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (props.items ?? []) as any[];
    const variant = props.variant ?? "number";

    return (
      <div className="divide-y rounded-lg border">
        {items.map((item, index) => {
          const title = String(item?.props?.title ?? "");
          const subtitle = item?.props?.subtitle
            ? String(item.props.subtitle)
            : undefined;
          const action = item?.props?.action as ActionSchema;
          const hasAction = !!action;
          const image = item?.props?.image as { src: string; alt: string } | undefined;

          const handleClick = hasAction
            ? () => {
                const actionType =
                  action?.type ?? BuiltinActionType.ContinueConversation;
                const actionParams =
                  action?.type === BuiltinActionType.OpenUrl
                    ? { url: (action as { url: string }).url }
                    : (action as { params?: Record<string, unknown> })?.params;
                triggerAction(title, undefined, {
                  type: actionType,
                  params: actionParams,
                });
              }
            : undefined;

          return (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 ${hasAction ? "cursor-pointer hover:bg-accent transition-colors" : ""}`}
              onClick={handleClick}
              role={hasAction ? "button" : undefined}
              tabIndex={hasAction ? 0 : undefined}
              onKeyDown={
                hasAction
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") handleClick?.();
                    }
                  : undefined
              }
            >
              {variant === "number" && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {index + 1}
                </span>
              )}
              {variant === "image" && image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-10 w-10 rounded-md object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-tight">{title}</p>
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
              {hasAction && (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    );
  },
});
