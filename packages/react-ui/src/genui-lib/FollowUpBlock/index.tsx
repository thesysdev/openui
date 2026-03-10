"use client";

import { defineComponent, useTriggerAction } from "@openuidev/react-lang";
import { z } from "zod";
import { FollowUpBlock as OpenUIFollowUpBlock } from "../../components/FollowUpBlock";
import { FollowUpItem as OpenUIFollowUpItem } from "../../components/FollowUpItem";
import { FollowUpItem } from "../FollowUpItem";

export const FollowUpBlock = defineComponent({
  name: "FollowUpBlock",
  props: z.object({
    items: z.array(FollowUpItem.ref),
  }),
  description: "List of clickable follow-up suggestions placed at the end of a response",
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const items = (props.items ?? []) as any[];

    return (
      <OpenUIFollowUpBlock>
        {items.map((item, i) => {
          const text = String(item?.props?.text ?? "");
          return <OpenUIFollowUpItem key={i} text={text} onClick={() => triggerAction(text)} />;
        })}
      </OpenUIFollowUpBlock>
    );
  },
});
