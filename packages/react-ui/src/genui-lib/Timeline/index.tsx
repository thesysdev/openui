"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Timeline as OpenUITimeline, type TimelineItemStatus } from "../../components/Timeline";
import { withoutOwnNumber } from "../helpers";
import { renderIconSlot } from "../iconSlot";
import { renderOneOrMany } from "../oneOrMany";
import { TimelineItemSchema } from "./schema";

export { TimelineItemSchema } from "./schema";

type Node = { typeName?: string; props?: { name?: string } } | undefined;

// A bare Icon leads as a neutral Avatar badge, like ListItem.
const leadingNode = (node: Node) =>
  node?.typeName === "Icon" && node.props?.name
    ? renderIconSlot({ typeName: "Avatar", props: { name: node.props.name, icon: node } })
    : renderIconSlot(node);

export const TimelineItem = defineComponent({
  name: "TimelineItem",
  props: TimelineItemSchema,
  description:
    'One event in a Timeline: TimelineItem(title, subtitle?, time?, leading?, status?). title is a string, or a Text, Link or Tag; emphasize a named event with Text("Doors open", "body", true). Never start a title with "1.", "-" or any other number or list marker: the rail already orders the events, and a leading badge already numbers them. subtitle is one line of context: a string, or a Text, Metric, Tag, TagBlock, LeadingText or Link. time is when it happens, shown in a column on the left: a short string such as "9:00 AM", "Day 2" or "Mar 2024", or a Text or Tag. leading is an optional Avatar, Icon or Emoji that replaces the dot, e.g. Avatar("Priya Shah", null, null, null, "inline", Icon("user", "people")) for who acted. status "done" fills the dot, "current" highlights it, "upcoming" quiets the title; leave it out for a plain history. When title or subtitle needs two or more pieces side by side, pass an array.',
  component: () => null,
});

export const Timeline = defineComponent({
  name: "Timeline",
  props: z.object({
    items: z.array(TimelineItem.ref),
  }),
  description:
    'Events in time order along a dashed rail: an itinerary, a schedule, order status, a project history or an activity log. Timeline([TimelineItem("Check in", "Hotel Lutetia", "3:00 PM"), TimelineItem(Text("Dinner", "body", true), "Septime · table for 2", "8:30 PM")]). Give every item a time when the moments are known; use status to show progress through a plan. Use Steps for how-to instructions and ListBlock for an unordered set.',
  component: ({ props, renderNode }) => {
    const items = (props.items ?? []) as {
      props?: {
        title?: unknown;
        subtitle?: unknown;
        time?: unknown;
        leading?: unknown;
        status?: TimelineItemStatus;
      };
    }[];
    const cell = (value: unknown) => renderOneOrMany(value, renderNode);

    return (
      <OpenUITimeline
        items={items.map((item) => {
          const p = item?.props ?? {};
          return {
            title: cell(withoutOwnNumber(p.title)),
            subtitle: cell(p.subtitle),
            time: cell(p.time),
            leading: p.leading ? leadingNode(p.leading as Node) : undefined,
            status: p.status,
          };
        })}
      />
    );
  },
});
