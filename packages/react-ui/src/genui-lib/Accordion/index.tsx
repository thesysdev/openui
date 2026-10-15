"use client";

import { ComponentRenderProps, defineComponent, type SubComponentOf } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import {
  Accordion as OpenUIAccordion,
  AccordionContent as OpenUIAccordionContent,
  AccordionItem as OpenUIAccordionItem,
  AccordionTrigger as OpenUIAccordionTrigger,
} from "../../components/Accordion";
import { renderIconSlot } from "../iconSlot";
import { AccordionItemSchema } from "./schema";

export { AccordionItemSchema } from "./schema";

export const AccordionItem = defineComponent({
  name: "AccordionItem",
  props: AccordionItemSchema,
  description:
    'One collapsible item: AccordionItem(value, trigger, content, leading?), e.g. AccordionItem("refunds", "Can I get a refund?", [Markdown("Yes, within 30 days of purchase.")], Icon("receipt", "finance")). value is a unique id; trigger is the title the reader clicks, a short question or topic; content is what opens. leading is optional: an Icon for a topic, an inline Avatar (with an icon) for the person who owns that item, or an Emoji only in rare expressive content. Give every item a leading or none of them.',
  component: () => null,
});

type AccordionRenderProps = ComponentRenderProps<{
  items: SubComponentOf<{
    value: string;
    trigger: string;
    content: unknown[];
    leading?: unknown;
  }>[];
}>;

/** Shared renderer — also used by the chat library's Accordion variant (wider content union). */
export const AccordionRenderer = ({ props, renderNode }: AccordionRenderProps) => {
  const items = props.items ?? [];
  const [openItem, setOpenItem] = React.useState<string>("");
  const userHasInteracted = React.useRef(false);
  const prevItemCount = React.useRef(0);

  // Auto-open: only when a NEW item arrives during streaming
  if (!userHasInteracted.current && items.length > prevItemCount.current) {
    const newest = items[items.length - 1];
    if (newest) setOpenItem(newest.props.value);
  }
  prevItemCount.current = items.length;

  const handleValueChange = (value: string) => {
    userHasInteracted.current = true;
    setOpenItem(value);
  };

  if (!items.length) return null;

  return (
    <OpenUIAccordion type="single" collapsible value={openItem} onValueChange={handleValueChange}>
      {items.map((item) => (
        <OpenUIAccordionItem key={item.props.value} value={item.props.value}>
          <OpenUIAccordionTrigger
            text={item.props.trigger}
            icon={item.props.leading ? renderIconSlot(item.props.leading) : undefined}
          />
          <OpenUIAccordionContent>{renderNode(item.props.content)}</OpenUIAccordionContent>
        </OpenUIAccordionItem>
      ))}
    </OpenUIAccordion>
  );
};

export const Accordion = defineComponent({
  name: "Accordion",
  props: z.object({
    items: z.array(AccordionItem.ref),
  }),
  description:
    "Collapsible items for supplementary detail the reader opens on demand, most often an FAQ: Accordion([item1, item2, item3]). Keep it to 3–5 items and place it last in its Section or Card; never hide primary information in it. For topics that are equally prominent parts of a long report use SectionBlock, and for alternative views use Tabs.",
  component: AccordionRenderer,
});
