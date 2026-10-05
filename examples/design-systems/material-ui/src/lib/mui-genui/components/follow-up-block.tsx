"use client";

import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { defineComponent, useTriggerAction } from "@openuidev/react-lang";
import { z } from "zod";

const FollowUpItemSchema = z.object({
  text: z.string(),
});

export const FollowUpItem = defineComponent({
  name: "FollowUpItem",
  props: FollowUpItemSchema,
  description: "Clickable follow-up suggestion — sends text as a user message when clicked.",
  component: () => null,
});

const FollowUpBlockSchema = z.object({
  items: z.array(FollowUpItem.ref),
});

export const FollowUpBlock = defineComponent({
  name: "FollowUpBlock",
  props: FollowUpBlockSchema,
  description: "List of follow-up suggestion chips at the end of a response.",
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (props.items ?? []) as any[];

    return (
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
        {items.map((item, i) => {
          const text = String(item?.props?.text ?? "");
          return (
            <Chip
              key={i}
              label={text}
              variant="outlined"
              size="small"
              clickable
              onClick={() => triggerAction(text)}
            />
          );
        })}
      </Stack>
    );
  },
});
