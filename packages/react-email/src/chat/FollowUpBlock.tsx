"use client";

import { BuiltinActionType, defineComponent, useTriggerAction } from "@openuidev/react-lang";
import { z } from "zod";
import { FollowUpItem } from "./FollowUpItem";

const isDark = () =>
  typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false;

export const FollowUpBlock = defineComponent({
  name: "FollowUpBlock",
  props: z.object({
    items: z.array(FollowUpItem.ref),
  }),
  description: "List of clickable follow-up suggestions placed at the end of a response",
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const items = (props.items ?? []) as Array<{ props: { text: string } }>;
    const dark = isDark();

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {items.map((item, i) => {
          const text = String(item?.props?.text ?? "");
          return (
            <button
              key={i}
              onClick={() =>
                triggerAction(text, undefined, {
                  type: BuiltinActionType.ContinueConversation,
                })
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 14px",
                borderRadius: "9999px",
                border: dark ? "1px solid #444" : "1px solid #e0e0e0",
                background: dark ? "#2a2a2a" : "#fff",
                color: dark ? "#e0e0e0" : "#1a1a1a",
                fontSize: "14px",
                cursor: "pointer",
                lineHeight: "1.4",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              }}
            >
              {text}
            </button>
          );
        })}
      </div>
    );
  },
});
