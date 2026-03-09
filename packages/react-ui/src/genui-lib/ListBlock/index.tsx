"use client";

import { defineComponent, useTriggerAction } from "@openuidev/lang-react";
import { z } from "zod";
import { ListBlock as OpenUIListBlock } from "../../components/ListBlock";
import { ListItem as OpenUIListItem } from "../../components/ListItem";
import { ListItem } from "../ListItem";

export const ListBlock = defineComponent({
  name: "ListBlock",
  props: z.object({
    items: z.array(ListItem.ref),
  }),
  description: "Numbered list — each item is clickable and sends its title as a user message",
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const items = (props.items ?? []) as any[];
    const listHasSubtitle = items.some((item) => !!item?.props?.subtitle);

    return (
      <OpenUIListBlock variant="number">
        {items.map((item, index) => {
          const title = String(item?.props?.title ?? "");
          const subtitle = item?.props?.subtitle ? String(item.props.subtitle) : undefined;
          return (
            <OpenUIListItem
              key={index}
              title={title}
              subtitle={subtitle}
              listHasSubtitle={listHasSubtitle}
              onClick={() => triggerAction(title)}
            />
          );
        })}
      </OpenUIListBlock>
    );
  },
});
