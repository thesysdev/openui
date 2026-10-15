"use client";

import type { ActionPlan } from "@openuidev/react-lang";
import { defineComponent, useTriggerAction } from "@openuidev/react-lang";
import { ChevronRight } from "lucide-react";
import { z } from "zod/v4";
import { ListBlock as OpenUIListBlock } from "../../components/ListBlock";
import { ListItem as OpenUIListItem } from "../../components/ListItem";
import { renderIconSlot } from "../iconSlot";
import { ListItem } from "../ListItem";
import { renderOneOrMany } from "../oneOrMany";

type Node = { typeName?: string; props?: { name?: string } } | undefined;

// A bare Icon leads as a neutral Avatar badge, like EntityTitle.
const leadingNode = (node: Node) =>
  node?.typeName === "Icon" && node.props?.name
    ? renderIconSlot({ typeName: "Avatar", props: { name: node.props.name, icon: node } })
    : renderIconSlot(node);

export const ListBlock = defineComponent({
  name: "ListBlock",
  props: z.object({
    items: z.array(ListItem.ref),
    variant: z.enum(["number", "plain"]).optional(),
  }),
  description:
    'A vertical list of ListItems for a set of options, picks or ranked results: ListBlock([item1, item2, item3]). variant "number" (default) puts a small black number inline before each title, for rankings, ordered picks or a short sequence; "plain" drops the numbers, for an unordered set such as people, companies or places that each lead with an Avatar. For named steps or options with a description, give each ListItem an emphasized title, ListItem(Text("Read the docs", "body", true), "Skim the quickstart."). Use Steps for a step-by-step process and EntityList for key/value facts. Give each ListItem an action to turn the list into a menu of follow-ups, or an actionSlot Button when each row needs its own verb such as Book or Approve.',
  component: ({ props, renderNode }) => {
    const triggerAction = useTriggerAction();
    const items = (props.items ?? []) as {
      props?: {
        title?: unknown;
        subtitle?: unknown;
        leading?: unknown;
        actionLabel?: string;
        action?: unknown;
        actionSlot?: unknown;
      };
    }[];
    const variant = (props.variant as "number" | "plain" | undefined) ?? "number";
    const listHasSubtitle = items.some((item) => !!item?.props?.subtitle);
    const cell = (value: unknown) => renderOneOrMany(value, renderNode);

    return (
      <OpenUIListBlock variant={variant}>
        {items.map((item, index) => {
          const p = item?.props ?? {};
          const titleText = typeof p.title === "string" ? p.title : String(index + 1);
          const actionLabel = p.actionLabel ? String(p.actionLabel) : undefined;
          const action = p.action;
          // An actionSlot (Button, Buttons, IconButton) owns the action; the row
          // itself is then not clickable.
          const actionSlot = p.actionSlot ? renderNode(p.actionSlot) : undefined;
          const hasAction = !!action && !actionSlot;

          const handleClick = hasAction
            ? () => triggerAction(titleText, undefined, action as ActionPlan | undefined)
            : undefined;

          return (
            <OpenUIListItem
              key={index}
              title={cell(p.title)}
              subtitle={cell(p.subtitle)}
              leading={p.leading ? leadingNode(p.leading as Node) : undefined}
              listHasSubtitle={listHasSubtitle}
              actionLabel={hasAction ? actionLabel : undefined}
              actionIcon={hasAction ? <ChevronRight size={16} /> : undefined}
              onClick={handleClick}
              actionSlot={actionSlot}
            />
          );
        })}
      </OpenUIListBlock>
    );
  },
});
