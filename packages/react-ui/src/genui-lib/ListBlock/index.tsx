"use client";

import type { ActionPlan } from "@openuidev/react-lang";
import { defineComponent, useTriggerAction } from "@openuidev/react-lang";
import { ChevronRight } from "lucide-react";
import { z } from "zod";
import { ListBlock as OpenUIListBlock } from "../../components/ListBlock";
import { ListItem as OpenUIListItem } from "../../components/ListItem";
import { ListItem } from "../ListItem";

export const ListBlock = defineComponent({
  name: "ListBlock",
  props: z.object({
    items: z.array(ListItem.ref),
    variant: z.enum(["number", "image"]).optional(),
  }),
  description:
    "A list of items with number or image indicators. Each item can optionally have an action.",
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const items = (props.items ?? []) as any[];
    const variant = (props.variant as "number" | "image") ?? "number";
    const listHasSubtitle = items.some((item) => !!item?.props?.subtitle);

    return (
      <OpenUIListBlock variant={variant}>
        {items.map((item, index) => {
          const title = String(item?.props?.title ?? "");
          const subtitle = item?.props?.subtitle ? String(item.props.subtitle) : undefined;
          const image = item?.props?.image as { src: string; alt: string } | undefined;
          const actionLabel = item?.props?.actionLabel ? String(item.props.actionLabel) : undefined;
          const action = item?.props?.action;
          const hasAction = !!action;

          const handleClick = hasAction
            ? () => triggerAction(title, undefined, action as ActionPlan | undefined)
            : undefined;

          return (
            <OpenUIListItem
              key={index}
              title={title}
              subtitle={subtitle}
              listHasSubtitle={listHasSubtitle}
              image={variant === "image" ? image : undefined}
              actionLabel={hasAction ? actionLabel : undefined}
              actionIcon={hasAction ? <ChevronRight size={16} /> : undefined}
              onClick={handleClick}
            />
          );
        })}
      </OpenUIListBlock>
    );
  },
});
