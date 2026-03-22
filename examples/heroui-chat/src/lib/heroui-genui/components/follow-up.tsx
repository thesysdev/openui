"use client";

import { Button, ButtonGroup } from "@heroui/react";
import {
  type ComponentRenderProps,
  defineComponent,
  useTriggerAction,
} from "@openuidev/react-lang";
import { CornerDownRight } from "lucide-react";
import { z } from "zod";

export const FollowUpItem = defineComponent({
  name: "FollowUpItem",
  props: z.object({
    text: z.string(),
  }),
  description: "Clickable follow-up suggestion — when clicked, sends text as user message",
  component: () => null,
});

const FollowUpBlockSchema = z.object({
  items: z.array(FollowUpItem.ref),
});

function FollowUpBlockRenderer({
  props,
}: ComponentRenderProps<z.infer<typeof FollowUpBlockSchema>>) {
  const triggerAction = useTriggerAction();
  const items = props.items ?? [];

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-default-500">
        Follow Ups
      </h3>
      <ButtonGroup orientation="vertical" fullWidth variant="ghost" size="sm">
        {items.flatMap((item, i) => {
          const text = String(item?.props?.text ?? "");
          const button = (
            <Button
              key={i}
              className="min-w-0 justify-start font-normal"
              onPress={() => triggerAction(text)}
            >
              <span className="flex w-full min-w-0 items-center gap-2">
                <CornerDownRight
                  className="size-4 shrink-0 text-default-400"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 text-left">{text}</span>
              </span>
            </Button>
          );
          if (i === 0) return [button];
          return [
            <ButtonGroup.Separator key={`sep-${i}`} />,
            button,
          ];
        })}
      </ButtonGroup>
    </div>
  );
}

export const FollowUpBlock = defineComponent({
  name: "FollowUpBlock",
  props: FollowUpBlockSchema,
  description: "List of clickable follow-up suggestions placed at the end of a response",
  component: FollowUpBlockRenderer,
});
